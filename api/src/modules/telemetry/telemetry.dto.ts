import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsIn, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

export class TelemetryEventDto {
  @IsIn(['web-vital', 'error', 'event'])
  kind: 'web-vital' | 'error' | 'event'

  @IsString()
  @MaxLength(60)
  name: string

  @IsOptional()
  @IsNumber()
  value?: number

  @IsOptional()
  @IsString()
  @MaxLength(40)
  rating?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string
}

export class TelemetryBatchDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventDto)
  events: TelemetryEventDto[]
}
