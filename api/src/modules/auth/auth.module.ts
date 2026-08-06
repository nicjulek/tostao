import { Module } from '@nestjs/common'
import { AccountsModule } from '../accounts/accounts.module'
import { CategoriesModule } from '../categories/categories.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [UsersModule, CategoriesModule, AccountsModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
