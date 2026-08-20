import { IsISO8601, IsOptional } from 'class-validator'

export class CheckUpcomingDto {
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Data inválida' })
  today?: string
}
