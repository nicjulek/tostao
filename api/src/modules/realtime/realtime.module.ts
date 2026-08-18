import { Global, Module } from '@nestjs/common'
import { RealtimeController } from './realtime.controller'
import { UserStreamService } from './user-stream.service'

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [UserStreamService],
  exports: [UserStreamService]
})
export class RealtimeModule {}
