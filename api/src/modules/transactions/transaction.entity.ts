import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Account } from '../accounts/account.entity'
import { Category } from '../categories/category.entity'
import { ImportBatch } from '../imports/import-batch.entity'
import { User } from '../users/user.entity'

@Entity('transactions')
@Index(['userId', 'date'])
@Index(['accountId', 'externalId'], { unique: true, where: '"external_id" IS NOT NULL' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'account_id' })
  accountId: string

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null

  @Column({ name: 'import_batch_id', type: 'uuid', nullable: true })
  importBatchId: string | null

  @ManyToOne(() => ImportBatch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'import_batch_id' })
  importBatch: ImportBatch | null

  @Column({ type: 'date' })
  date: string

  @Column({ length: 300 })
  description: string

  @Column({ type: 'integer' })
  amount: number

  @Column({ name: 'external_id', type: 'varchar', length: 120, nullable: true })
  externalId: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
