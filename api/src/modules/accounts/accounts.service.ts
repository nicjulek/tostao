import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryFailedError, Repository } from 'typeorm'
import { Transaction } from '../transactions/transaction.entity'
import { Account } from './account.entity'
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto'

export interface AccountWithBalance extends Account {
  balance: number
  transactionCount: number
}

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(Account) private readonly accounts: Repository<Account>) {}

  async createDefaults(manager: EntityManager, userId: string): Promise<void> {
    await manager.save(Account, [
      manager.create(Account, { userId, name: 'Conta corrente', kind: 'checking', color: '#3d6b5c' }),
      manager.create(Account, { userId, name: 'Cartão de crédito', kind: 'credit', color: '#7a4fb3' })
    ])
  }

  async list(userId: string): Promise<AccountWithBalance[]> {
    const rows = await this.accounts
      .createQueryBuilder('a')
      .leftJoin(Transaction, 't', 't.account_id = a.id')
      .select('a.id', 'id')
      .addSelect('COALESCE(SUM(t.amount), 0)::int', 'balance')
      .addSelect('COUNT(t.id)::int', 'transactionCount')
      .where('a.user_id = :userId', { userId })
      .groupBy('a.id')
      .getRawMany<{ id: string; balance: number; transactionCount: number }>()
    const totals = new Map(rows.map((r) => [r.id, r]))
    const accounts = await this.accounts.find({ where: { userId }, order: { createdAt: 'ASC' } })
    return accounts.map((a) => ({
      ...a,
      balance: totals.get(a.id)?.balance ?? 0,
      transactionCount: totals.get(a.id)?.transactionCount ?? 0
    }))
  }

  async get(userId: string, id: string): Promise<Account> {
    const account = await this.accounts.findOne({ where: { id, userId } })
    if (!account) throw new NotFoundException('Conta não encontrada')
    return account
  }

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    return this.saveUnique(this.accounts.create({ ...dto, userId }))
  }

  async update(userId: string, id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.get(userId, id)
    Object.assign(account, dto)
    return this.saveUnique(account)
  }

  async remove(userId: string, id: string): Promise<void> {
    const account = await this.get(userId, id)
    await this.accounts.remove(account)
  }

  private async saveUnique(account: Account): Promise<Account> {
    try {
      return await this.accounts.save(account)
    } catch (error) {
      if (error instanceof QueryFailedError && (error as QueryFailedError & { code?: string }).code === '23505') {
        throw new ConflictException('Você já tem uma conta com esse nome')
      }
      throw error
    }
  }
}
