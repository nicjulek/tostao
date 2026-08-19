import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from '../categories/category.entity'
import { User } from '../users/user.entity'

export const MATCH_TYPES = ['contains', 'starts_with', 'exact'] as const
export type MatchType = (typeof MATCH_TYPES)[number]

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 120 })
  pattern: string

  @Column({ name: 'match_type', type: 'varchar', length: 12, default: 'contains' })
  matchType: MatchType

  @Column({ name: 'category_id' })
  categoryId: string

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category

  @Column({ type: 'integer', default: 0 })
  priority: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
