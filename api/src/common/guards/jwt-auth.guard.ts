import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const [type, token] = String(request.headers.authorization ?? '').split(' ')
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Faça login para continuar')

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token)
      request.user = { id: payload.sub, email: payload.email }
      return true
    } catch {
      throw new UnauthorizedException('Sua sessão expirou. Entre de novo.')
    }
  }
}
