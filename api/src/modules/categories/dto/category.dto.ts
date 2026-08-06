import { PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsHexColor, IsIn, IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator'
import { CATEGORY_KINDS, CategoryKind } from '../category.entity'

export class CreateCategoryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 40, { message: 'O nome precisa ter entre 1 e 40 caracteres' })
  name: string

  @IsIn(CATEGORY_KINDS, { message: 'Tipo de categoria inválido' })
  kind: CategoryKind

  @IsHexColor({ message: 'Cor inválida' })
  color: string

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt({ message: 'O orçamento deve ser em centavos' })
  @Min(0)
  @Max(1_000_000_000)
  monthlyBudget?: number | null
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
