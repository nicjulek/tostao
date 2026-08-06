import { PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsHexColor, IsIn, IsOptional, IsString, Length } from 'class-validator'
import { ACCOUNT_KINDS, AccountKind } from '../account.entity'

export class CreateAccountDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 60, { message: 'O nome precisa ter entre 1 e 60 caracteres' })
  name: string

  @IsIn(ACCOUNT_KINDS, { message: 'Tipo de conta inválido' })
  kind: AccountKind

  @IsOptional()
  @IsHexColor({ message: 'Cor inválida' })
  color?: string
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
