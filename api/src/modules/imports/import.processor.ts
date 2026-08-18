import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { RulesService } from '../rules/rules.service'
import { Transaction } from '../transactions/transaction.entity'
import { IMPORT_REQUESTED, ImportProgress, ImportRequestedEvent, TRANSACTIONS_IMPORTED, TransactionsImportedEvent } from './import.events'
import { ImportBatch } from './import-batch.entity'
import { UserStreamService } from '../realtime/user-stream.service'

const CHUNK = 500

@Injectable()
export class ImportProcessor {
  private readonly logger = new Logger(ImportProcessor.name)

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    @InjectRepository(ImportBatch) private readonly batches: Repository<ImportBatch>,
    private readonly rules: RulesService,
    private readonly stream: UserStreamService,
    private readonly events: EventEmitter2
  ) {}

  @OnEvent(IMPORT_REQUESTED, { async: true, promisify: true })
  async handle(event: ImportRequestedEvent): Promise<void> {
    const started = Date.now()
    const { batchId, userId, accountId, statement } = event
    const progress = (p: Omit<ImportProgress, 'batchId'>) => this.stream.publish(userId, 'import', { batchId, ...p })

    try {
      progress({ stage: 'received', percent: 5, message: `${statement.transactions.length} transações lidas` })

      progress({ stage: 'deduplicating', percent: 20, message: 'Procurando transações já importadas' })
      const ids = statement.transactions.map((t) => t.externalId).filter((id): id is string => !!id)
      const existing = new Set<string>()
      for (let i = 0; i < ids.length; i += 1000) {
        const found = await this.transactions.find({
          where: { accountId, externalId: In(ids.slice(i, i + 1000)) },
          select: { externalId: true }
        })
        found.forEach((f) => f.externalId && existing.add(f.externalId))
      }
      const fresh = statement.transactions.filter((t) => !t.externalId || !existing.has(t.externalId))
      const duplicates = statement.transactions.length - fresh.length

      progress({ stage: 'categorizing', percent: 45, message: 'Aplicando suas regras e categorias' })
      const categorizer = await this.rules.categorizerFor(userId)
      let categorized = 0
      const rows = fresh.map((t) => {
        const { categoryId, source } = categorizer.categorize(t.description, t.amount)
        if (source === 'rule' || source === 'default') categorized++
        return this.transactions.create({
          userId,
          accountId,
          importBatchId: batchId,
          categoryId,
          date: t.date,
          description: t.description.slice(0, 300),
          amount: t.amount,
          externalId: t.externalId,
          notes: null
        })
      })

      await this.dataSource.transaction(async (manager) => {
        for (let i = 0; i < rows.length; i += CHUNK) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(Transaction)
            .values(rows.slice(i, i + CHUNK))
            .orIgnore()
            .execute()
          progress({
            stage: 'saving',
            percent: Math.min(95, 50 + Math.round((Math.min(i + CHUNK, rows.length) / Math.max(rows.length, 1)) * 45)),
            message: `Salvando ${Math.min(i + CHUNK, rows.length)} de ${rows.length}`
          })
        }
        await manager.update(ImportBatch, batchId, {
          status: 'done',
          importedCount: rows.length,
          duplicateCount: duplicates,
          categorizedCount: categorized
        })
      })

      progress({
        stage: 'done',
        percent: 100,
        message: rows.length ? `${rows.length} transações importadas` : 'Nada novo: tudo já estava importado',
        imported: rows.length,
        duplicates,
        categorized
      })
      const done: TransactionsImportedEvent = { batchId, userId, imported: rows.length, duplicates, durationMs: Date.now() - started }
      this.events.emit(TRANSACTIONS_IMPORTED, done)
    } catch (error) {
      this.logger.error({ err: error, batchId }, 'Falha ao processar importação')
      await this.batches.update(batchId, { status: 'failed', error: 'Falha ao salvar as transações' }).catch(() => undefined)
      progress({ stage: 'failed', percent: 100, message: 'Não foi possível concluir a importação' })
    }
  }

  @OnEvent(TRANSACTIONS_IMPORTED)
  record(event: TransactionsImportedEvent): void {
    this.logger.log({ event: TRANSACTIONS_IMPORTED, ...event }, 'Importação concluída')
  }
}
