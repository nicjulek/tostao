import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from '../categories/category.entity'
import { CategoriesService } from '../categories/categories.service'
import { DEFAULT_CATEGORIES, FALLBACK } from '../categories/defaults'
import { Transaction } from '../transactions/transaction.entity'
import { Categorizer } from './categorizer'
import { CreateRuleDto, UpdateRuleDto } from './dto/rule.dto'
import { Rule } from './rule.entity'

@Injectable()
export class RulesService {
  constructor(
    @InjectRepository(Rule) private readonly rules: Repository<Rule>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly categories: CategoriesService
  ) {}

  list(userId: string): Promise<Rule[]> {
    return this.rules.find({ where: { userId }, relations: { category: true }, order: { priority: 'DESC', createdAt: 'DESC' } })
  }

  async categorizerFor(userId: string): Promise<Categorizer> {
    const [rules, categories] = await Promise.all([this.rules.find({ where: { userId } }), this.categories.list(userId)])
    return new Categorizer(rules, categories)
  }

  async create(userId: string, dto: CreateRuleDto): Promise<{ rule: Rule; applied: number }> {
    await this.categories.get(userId, dto.categoryId)
    const rule = await this.rules.save(
      this.rules.create({
        userId,
        pattern: dto.pattern,
        matchType: dto.matchType ?? 'contains',
        categoryId: dto.categoryId,
        priority: dto.priority ?? 0
      })
    )
    const applied = dto.applyToExisting ? await this.apply(userId, true) : 0
    return { rule: await this.get(userId, rule.id), applied }
  }

  async get(userId: string, id: string): Promise<Rule> {
    const rule = await this.rules.findOne({ where: { id, userId }, relations: { category: true } })
    if (!rule) throw new NotFoundException('Regra não encontrada')
    return rule
  }

  async update(userId: string, id: string, dto: UpdateRuleDto): Promise<Rule> {
    const rule = await this.get(userId, id)
    if (dto.categoryId) await this.categories.get(userId, dto.categoryId)
    if (dto.pattern !== undefined) rule.pattern = dto.pattern
    if (dto.matchType !== undefined) rule.matchType = dto.matchType
    if (dto.categoryId !== undefined) rule.categoryId = dto.categoryId
    if (dto.priority !== undefined) rule.priority = dto.priority
    rule.category = undefined as unknown as Category
    await this.rules.save(rule)
    return this.get(userId, id)
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.rules.remove(await this.get(userId, id))
  }

  async apply(userId: string, overwriteAutomatic: boolean): Promise<number> {
    const categorizer = await this.categorizerFor(userId)
    const categories = await this.categories.list(userId)
    const automatic = new Set(
      categories
        .filter((c) => c.name === FALLBACK.expense || c.name === FALLBACK.income || DEFAULT_CATEGORIES.some((d) => d.name === c.name))
        .map((c) => c.id)
    )
    const list = await this.transactions.find({
      where: { userId },
      select: { id: true, description: true, amount: true, categoryId: true }
    })
    const changes = new Map<string, string[]>()
    for (const t of list) {
      const replaceable = t.categoryId === null || (overwriteAutomatic && automatic.has(t.categoryId))
      if (!replaceable) continue
      const { categoryId, source } = categorizer.categorize(t.description, t.amount)
      if (!categoryId || categoryId === t.categoryId) continue
      if (t.categoryId !== null && source !== 'rule') continue
      const ids = changes.get(categoryId) ?? []
      ids.push(t.id)
      changes.set(categoryId, ids)
    }
    let updated = 0
    for (const [categoryId, ids] of changes) {
      for (let i = 0; i < ids.length; i += 500) {
        const result = await this.transactions
          .createQueryBuilder()
          .update()
          .set({ categoryId })
          .where('user_id = :userId AND id IN (:...ids)', { userId, ids: ids.slice(i, i + 500) })
          .execute()
        updated += result.affected ?? 0
      }
    }
    return updated
  }
}
