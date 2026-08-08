import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, In, Repository } from 'typeorm'
import { AccountsService } from '../accounts/accounts.service'
import { CategoriesService } from '../categories/categories.service'
import { BulkCategorizeDto, CreateTransactionDto, ListTransactionsQuery, UpdateTransactionDto } from './dto/transaction.dto'
import { Transaction } from './transaction.entity'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totals: { income: number; expense: number }
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService
  ) {}

  async list(userId: string, q: ListTransactionsQuery): Promise<Page<Transaction>> {
    if (q.from && q.to && q.from > q.to) throw new BadRequestException('A data inicial é depois da final')
    const base = this.transactions.createQueryBuilder('t').where('t.user_id = :userId', { userId })
    if (q.from) base.andWhere('t.date >= :from', { from: q.from })
    if (q.to) base.andWhere('t.date <= :to', { to: q.to })
    if (q.accountId) base.andWhere('t.account_id = :accountId', { accountId: q.accountId })
    if (q.categoryId === 'none') base.andWhere('t.category_id IS NULL')
    else if (q.categoryId) base.andWhere('t.category_id = :categoryId', { categoryId: q.categoryId })
    if (q.type === 'income') base.andWhere('t.amount > 0')
    if (q.type === 'expense') base.andWhere('t.amount < 0')
    if (q.search) {
      base.andWhere(
        new Brackets((w) => {
          w.where('unaccent(t.description) ILIKE unaccent(:s)', { s: `%${q.search}%` }).orWhere('unaccent(t.notes) ILIKE unaccent(:s)')
        })
      )
    }

    const totalsRow = await base
      .clone()
      .leftJoin('t.category', 'c')
      .select(
        "COALESCE(SUM(CASE WHEN t.amount > 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount ELSE 0 END), 0)::int",
        'income'
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN t.amount < 0 AND (c.kind IS NULL OR c.kind <> 'transfer') THEN t.amount ELSE 0 END), 0)::int",
        'expense'
      )
      .addSelect('COUNT(*)::int', 'total')
      .getRawOne<{ income: number; expense: number; total: number }>()

    const items = await base
      .clone()
      .leftJoinAndSelect('t.category', 'category')
      .leftJoinAndSelect('t.account', 'account')
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .addOrderBy('t.id', 'ASC')
      .skip((q.page - 1) * q.pageSize)
      .take(q.pageSize)
      .getMany()

    return {
      items,
      total: totalsRow?.total ?? 0,
      page: q.page,
      pageSize: q.pageSize,
      totals: { income: totalsRow?.income ?? 0, expense: totalsRow?.expense ?? 0 }
    }
  }

  async get(userId: string, id: string): Promise<Transaction> {
    const t = await this.transactions.findOne({ where: { id, userId }, relations: { category: true, account: true } })
    if (!t) throw new NotFoundException('Transação não encontrada')
    return t
  }

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.accounts.get(userId, dto.accountId)
    if (dto.categoryId) await this.categories.get(userId, dto.categoryId)
    const saved = await this.transactions.save(
      this.transactions.create({
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId ?? null,
        date: dto.date,
        description: dto.description,
        amount: dto.amount,
        notes: dto.notes ?? null,
        externalId: null,
        importBatchId: null
      })
    )
    return this.get(userId, saved.id)
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const t = await this.get(userId, id)
    if (dto.categoryId) await this.categories.get(userId, dto.categoryId)
    if (dto.categoryId !== undefined) t.categoryId = dto.categoryId
    if (dto.date !== undefined) t.date = dto.date
    if (dto.description !== undefined) t.description = dto.description
    if (dto.amount !== undefined) t.amount = dto.amount
    if (dto.notes !== undefined) t.notes = dto.notes
    t.category = null
    await this.transactions.save(t)
    return this.get(userId, id)
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.transactions.remove(await this.get(userId, id))
  }

  async bulkCategorize(userId: string, dto: BulkCategorizeDto): Promise<{ updated: number }> {
    if (dto.categoryId) await this.categories.get(userId, dto.categoryId)
    const result = await this.transactions.update({ userId, id: In(dto.ids) }, { categoryId: dto.categoryId })
    return { updated: result.affected ?? 0 }
  }
}
