import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } })
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users.createQueryBuilder('u').addSelect('u.passwordHash').where('u.email = :email', { email: email.toLowerCase() }).getOne()
  }

  async create(manager: EntityManager, data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const email = data.email.toLowerCase()
    const exists = await manager.exists(User, { where: { email } })
    if (exists) throw new ConflictException('Já existe uma conta com este e-mail')
    return manager.save(manager.create(User, { ...data, email }))
  }
}
