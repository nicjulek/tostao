import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReportsModule } from '../reports/reports.module'
import { Transaction } from '../transactions/transaction.entity'
import { User } from '../users/user.entity'
import { UsersModule } from '../users/users.module'
import { MailService } from './mail.service'
import { Notification } from './notification.entity'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { RecurringAlertsService } from './recurring-alerts.service'

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Transaction]), ReportsModule, UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RecurringAlertsService, MailService]
})
export class NotificationsModule {}
