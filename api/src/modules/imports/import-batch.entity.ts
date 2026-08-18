import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Account } from '../accounts/account.entity'
import { User } from '../users/user.entity'

export type ImportStatus = 'processing' | 'done' | 'failed'

@Entity('import_batches')
export class ImportBatch {
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

  @Column({ length: 200 })
  filename: string

  @Column({ length: 30 })
  format: string

  @Column({ type: 'varchar', length: 12, default: 'processing' })
  status: ImportStatus

  @Column({ type: 'varchar', length: 300, nullable: true })
  error: string | null

  @Column({ name: 'total_count', type: 'integer', default: 0 })
  totalCount: number

  @Column({ name: 'imported_count', type: 'integer', default: 0 })
  importedCount: number

  @Column({ name: 'duplicate_count', type: 'integer', default: 0 })
  duplicateCount: number

  @Column({ name: 'categorized_count', type: 'integer', default: 0 })
  categorizedCount: number

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart: string | null

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
