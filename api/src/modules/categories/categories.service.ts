import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryFailedError, Repository } from 'typeorm'
import { Category } from './category.entity'
import { DEFAULT_CATEGORIES } from './defaults'
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto'

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly categories: Repository<Category>) {}

  async createDefaults(manager: EntityManager, userId: string): Promise<void> {
    await manager.save(
      Category,
      DEFAULT_CATEGORIES.map((c) => manager.create(Category, { userId, name: c.name, kind: c.kind, color: c.color, monthlyBudget: null }))
    )
  }

  list(userId: string): Promise<Category[]> {
    return this.categories.find({ where: { userId }, order: { kind: 'ASC', name: 'ASC' } })
  }

  async get(userId: string, id: string): Promise<Category> {
    const category = await this.categories.findOne({ where: { id, userId } })
    if (!category) throw new NotFoundException('Categoria não encontrada')
    return category
  }

  create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.saveUnique(this.categories.create({ ...dto, monthlyBudget: dto.monthlyBudget ?? null, userId }))
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.get(userId, id)
    Object.assign(category, dto)
    return this.saveUnique(category)
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.categories.remove(await this.get(userId, id))
  }

  private async saveUnique(category: Category): Promise<Category> {
    try {
      return await this.categories.save(category)
    } catch (error) {
      if (error instanceof QueryFailedError && (error as QueryFailedError & { code?: string }).code === '23505') {
        throw new ConflictException('Você já tem uma categoria com esse nome')
      }
      throw error
    }
  }
}
