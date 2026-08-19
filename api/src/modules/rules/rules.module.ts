import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CategoriesModule } from '../categories/categories.module'
import { Transaction } from '../transactions/transaction.entity'
import { Rule } from './rule.entity'
import { RulesController } from './rules.controller'
import { RulesService } from './rules.service'

@Module({
  imports: [TypeOrmModule.forFeature([Rule, Transaction]), CategoriesModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService]
})
export class RulesModule {}
