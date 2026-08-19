import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger'
import { currentMonth } from '../../common/utils/dates'
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { ReportsService } from './reports.service'

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @ApiQuery({ name: 'month', required: false, example: '2026-10' })
  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.reports.summary(user.id, month ?? currentMonth())
  }

  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'months', required: false })
  @Get('trend')
  trend(
    @CurrentUser() user: AuthUser,
    @Query('months', new DefaultValuePipe(12), ParseIntPipe) months: number,
    @Query('month') month?: string
  ) {
    return this.reports.trend(user.id, month ?? currentMonth(), months)
  }

  @ApiQuery({ name: 'month', required: false })
  @Get('recurring')
  recurring(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.reports.recurring(user.id, month ?? currentMonth())
  }
}
