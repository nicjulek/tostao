import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { CheckUpcomingDto } from './dto/check.dto'
import { NotificationsService } from './notifications.service'
import { RecurringAlertsService, todayInBrazil } from './recurring-alerts.service'

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly alerts: RecurringAlertsService
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id)
  }

  @Post('check')
  @HttpCode(200)
  async check(@CurrentUser() user: AuthUser, @Body() dto: CheckUpcomingDto) {
    return { created: await this.alerts.checkUpcoming(user.id, dto.today ?? todayInBrazil()) }
  }

  @Get('email')
  email() {
    return { enabled: this.notifications.emailEnabled() }
  }

  @Post('test-email')
  @HttpCode(200)
  testEmail(@CurrentUser() user: AuthUser) {
    return this.notifications.sendTestEmail(user.id)
  }

  @Patch('read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id)
  }

  @Patch(':id/read')
  @HttpCode(204)
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markRead(user.id, id)
  }
}
