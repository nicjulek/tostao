import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../users/user.entity'

export const CATEGORY_KINDS = ['expense', 'income', 'transfer'] as const
export type CategoryKind = (typeof CATEGORY_KINDS)[number]

@Entity('categories')
@Index(['userId', 'name'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 40 })
  name: string

  @Column({ type: 'varchar', length: 10 })
  kind: CategoryKind

  @Column({ length: 9 })
  color: string

  @Column({ name: 'monthly_budget', type: 'integer', nullable: true })
  monthlyBudget: number | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
