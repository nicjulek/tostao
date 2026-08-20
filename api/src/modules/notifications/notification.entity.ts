import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../users/user.entity'

export type NotificationKind = 'upcoming_charge' | 'price_increase'

@Entity('notifications')
@Index(['userId', 'dedupeKey'], { unique: true })
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ type: 'varchar', length: 30 })
  kind: NotificationKind

  @Column({ length: 140 })
  title: string

  @Column({ length: 400 })
  body: string

  @Column({ name: 'dedupe_key', length: 200 })
  dedupeKey: string

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
