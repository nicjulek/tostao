import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { AccountsService } from '../accounts/accounts.service'
import { Transaction } from '../transactions/transaction.entity'
import { IMPORT_REQUESTED, ImportRequestedEvent } from './import.events'
import { ImportBatch } from './import-batch.entity'
import { ParsedStatement, parseStatement, StatementError } from './parsers'

export interface UploadedStatement {
  originalname: string
  buffer: Buffer
  size: number
}

export interface ImportPreview {
  format: string
  label: string
  suggestedAccountKind: 'checking' | 'credit' | null
  total: number
  duplicates: number | null
  periodStart: string | null
  periodEnd: string | null
  income: number
  expense: number
  sample: ParsedStatement['transactions']
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024

@Injectable()
export class ImportsService {
  constructor(
    @InjectRepository(ImportBatch) private readonly batches: Repository<ImportBatch>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
    private readonly accounts: AccountsService,
    private readonly events: EventEmitter2
  ) {}

  parse(file: UploadedStatement | undefined): ParsedStatement {
    if (!file) throw new BadRequestException('Envie o arquivo do extrato')
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('O arquivo passa de 5 MB')
    try {
      return parseStatement(file.buffer)
    } catch (error) {
      if (error instanceof StatementError) throw new BadRequestException(error.message)
      throw new BadRequestException('Não consegui ler este arquivo. Envie o CSV ou OFX exportado pelo banco.')
    }
  }

  async preview(userId: string, file: UploadedStatement | undefined, accountId?: string): Promise<ImportPreview> {
    const statement = this.parse(file)
    const list = statement.transactions
    let duplicates: number | null = null
    if (accountId) {
      await this.accounts.get(userId, accountId)
      duplicates = await this.countExisting(
        accountId,
        list.map((t) => t.externalId).filter((id): id is string => !!id)
      )
    }
    const dates = list.map((t) => t.date).sort()
    return {
      format: statement.format,
      label: statement.label,
      suggestedAccountKind: statement.suggestedAccountKind,
      total: list.length,
      duplicates,
      periodStart: dates[0] ?? null,
      periodEnd: dates[dates.length - 1] ?? null,
      income: list.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      expense: list.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0),
      sample: list.slice(0, 6)
    }
  }

  async start(userId: string, accountId: string, file: UploadedStatement | undefined, dispatch = true): Promise<ImportBatch> {
    await this.accounts.get(userId, accountId)
    const statement = this.parse(file)
    const dates = statement.transactions.map((t) => t.date).sort()
    const batch = await this.batches.save(
      this.batches.create({
        userId,
        accountId,
        filename: (file?.originalname ?? 'extrato').slice(0, 200),
        format: statement.format,
        status: 'processing',
        totalCount: statement.transactions.length,
        periodStart: dates[0] ?? null,
        periodEnd: dates[dates.length - 1] ?? null
      })
    )
    const event: ImportRequestedEvent = { batchId: batch.id, userId, accountId, statement }
    if (dispatch) setImmediate(() => void this.events.emitAsync(IMPORT_REQUESTED, event))
    return batch
  }

  list(userId: string): Promise<ImportBatch[]> {
    return this.batches.find({ where: { userId }, relations: { account: true }, order: { createdAt: 'DESC' }, take: 50 })
  }

  async get(userId: string, id: string): Promise<ImportBatch> {
    const batch = await this.batches.findOne({ where: { id, userId }, relations: { account: true } })
    if (!batch) throw new NotFoundException('Importação não encontrada')
    return batch
  }

  async undo(userId: string, id: string): Promise<{ removed: number }> {
    const batch = await this.get(userId, id)
    const removed = await this.transactions.count({ where: { importBatchId: batch.id } })
    await this.batches.remove(batch)
    return { removed }
  }

  async countExisting(accountId: string, externalIds: string[]): Promise<number> {
    let count = 0
    for (let i = 0; i < externalIds.length; i += 1000) {
      count += await this.transactions.count({ where: { accountId, externalId: In(externalIds.slice(i, i + 1000)) } })
    }
    return count
  }
}
