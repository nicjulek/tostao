import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AccountsModule } from '../accounts/accounts.module'
import { RulesModule } from '../rules/rules.module'
import { Transaction } from '../transactions/transaction.entity'
import { ImportBatch } from './import-batch.entity'
import { ImportProcessor } from './import.processor'
import { ImportsController } from './imports.controller'
import { ImportsService } from './imports.service'

@Module({
  imports: [TypeOrmModule.forFeature([ImportBatch, Transaction]), AccountsModule, RulesModule],
  controllers: [ImportsController],
  providers: [ImportsService, ImportProcessor]
})
export class ImportsModule {}
