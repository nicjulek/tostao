import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  NotEquals,
  ValidateIf
} from 'class-validator'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class ListTransactionsQuery {
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Data inicial inválida' })
  from?: string

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Data final inválida' })
  to?: string

  @IsOptional()
  @IsUUID()
  accountId?: string

  @ApiPropertyOptional({ description: 'Id da categoria ou "none" para sem categoria' })
  @IsOptional()
  @ValidateIf((_, v) => v !== 'none')
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: 'income' | 'expense'

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  search?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize: number = 100
}

export class CreateTransactionDto {
  @IsUUID()
  accountId: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  categoryId?: string | null

  @IsISO8601({ strict: true }, { message: 'Data inválida' })
  date: string

  @Transform(trim)
  @IsString()
  @Length(1, 300, { message: 'A descrição precisa ter entre 1 e 300 caracteres' })
  description: string

  @ApiPropertyOptional({ description: 'Valor em centavos: negativo para gasto, positivo para entrada' })
  @IsInt({ message: 'O valor deve ser em centavos' })
  @NotEquals(0, { message: 'O valor não pode ser zero' })
  @Min(-100_000_000_00)
  @Max(100_000_000_00)
  amount: number

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null
}

export class UpdateTransactionDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  categoryId?: string | null

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Data inválida' })
  date?: string

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 300)
  description?: string

  @IsOptional()
  @IsInt()
  @NotEquals(0)
  amount?: number

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  notes?: string | null
}

export class BulkCategorizeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  ids: string[]

  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  categoryId: string | null
}
