import { Injectable, MessageEvent } from '@nestjs/common'
import { filter, map, Observable, Subject } from 'rxjs'

export type StreamEventType = 'import' | 'notification'

@Injectable()
export class UserStreamService {
  private readonly events = new Subject<{ userId: string; type: StreamEventType; data: object }>()

  publish(userId: string, type: StreamEventType, data: object): void {
    this.events.next({ userId, type, data })
  }

  streamFor(userId: string): Observable<MessageEvent> {
    return this.events.pipe(
      filter((e) => e.userId === userId),
      map((e): MessageEvent => ({ type: e.type, data: e.data }))
    )
  }
}
