import { Column, CreateDateColumn, Entity, Index, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../users/user.entity'

export const ACCOUNT_KINDS = ['checking', 'credit', 'savings', 'cash'] as const
export type AccountKind = (typeof ACCOUNT_KINDS)[number]

@Entity('accounts')
@Index(['userId', 'name'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ length: 60 })
  name: string

  @Column({ type: 'varchar', length: 12 })
  kind: AccountKind

  @Column({ length: 9, default: '#3d6b5c' })
  color: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
