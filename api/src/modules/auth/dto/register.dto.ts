import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length, MaxLength } from 'class-validator'

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 80, { message: 'O nome precisa ter entre 2 e 80 caracteres' })
  name: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @MaxLength(160)
  email: string

  @IsString()
  @Length(8, 72, { message: 'A senha precisa ter entre 8 e 72 caracteres' })
  password: string
}
