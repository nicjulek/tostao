import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { DataSource } from 'typeorm'
import { AccountsService } from '../accounts/accounts.service'
import { CategoriesService } from '../categories/categories.service'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

export interface AuthResult {
  accessToken: string
  user: Pick<User, 'id' | 'name' | 'email'>
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UsersService,
    private readonly categories: CategoriesService,
    private readonly accounts: AccountsService,
    private readonly jwt: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.dataSource.transaction(async (manager) => {
      const created = await this.users.create(manager, { name: dto.name, email: dto.email, passwordHash })
      await this.categories.createDefaults(manager, created.id)
      await this.accounts.createDefaults(manager, created.id)
      return created
    })
    return this.issue(user)
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email)
    const ok = user ? await bcrypt.compare(dto.password, user.passwordHash) : false
    if (!user || !ok) throw new UnauthorizedException('E-mail ou senha incorretos')
    return this.issue(user)
  }

  private async issue(user: User): Promise<AuthResult> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email })
    return { accessToken, user: { id: user.id, name: user.name, email: user.email } }
  }
}
