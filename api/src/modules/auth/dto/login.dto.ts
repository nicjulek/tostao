import { Transform } from 'class-transformer'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string

  @IsString()
  @MinLength(1, { message: 'Informe a senha' })
  password: string
}
