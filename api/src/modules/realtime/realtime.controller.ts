import { Controller, MessageEvent, Query, Sse, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ApiTags } from '@nestjs/swagger'
import { interval, map, merge, Observable } from 'rxjs'
import { Public } from '../../common/decorators/public.decorator'
import { UserStreamService } from './user-stream.service'

@ApiTags('realtime')
@Controller('stream')
export class RealtimeController {
  constructor(
    private readonly stream: UserStreamService,
    private readonly jwt: JwtService
  ) {}

  @Public()
  @Sse()
  async events(@Query('token') token: string): Promise<Observable<MessageEvent>> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token ?? '')
      const heartbeat = interval(25_000).pipe(map((): MessageEvent => ({ type: 'ping', data: { at: Date.now() } })))
      return merge(this.stream.streamFor(payload.sub), heartbeat)
    } catch {
      throw new UnauthorizedException('Faça login para receber atualizações')
    }
  }
}
