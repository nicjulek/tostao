import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { Public } from '../../common/decorators/public.decorator'
import { TelemetryBatchDto } from './telemetry.dto'

@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger('Telemetry')

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(202)
  @Post()
  collect(@Body() batch: TelemetryBatchDto): void {
    for (const event of batch.events) {
      if (event.kind === 'error') this.logger.warn({ telemetry: event }, `Erro no front: ${event.name}`)
      else this.logger.log({ telemetry: event }, `${event.kind}: ${event.name}`)
    }
  }
}
