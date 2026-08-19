import { PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator'
import { MATCH_TYPES, MatchType } from '../rule.entity'

export class CreateRuleDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 120, { message: 'O texto da regra precisa ter entre 2 e 120 caracteres' })
  pattern: string

  @IsOptional()
  @IsIn(MATCH_TYPES)
  matchType?: MatchType

  @IsUUID()
  categoryId: string

  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  priority?: number

  @IsOptional()
  @IsBoolean()
  applyToExisting?: boolean
}

export class UpdateRuleDto extends PartialType(CreateRuleDto) {}

export class ApplyRulesDto {
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean
}
