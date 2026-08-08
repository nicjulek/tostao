import { IsOptional, IsUUID } from 'class-validator'

export class ImportFileDto {
  @IsUUID('all', { message: 'Escolha a conta do extrato' })
  accountId: string
}

export class PreviewFileDto {
  @IsOptional()
  @IsUUID()
  accountId?: string
}

export const FILE_BODY = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary', description: 'CSV ou OFX exportado pelo banco' },
      accountId: { type: 'string', format: 'uuid' }
    }
  }
}
