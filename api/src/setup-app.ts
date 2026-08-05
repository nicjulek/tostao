import { INestApplication, ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'

export function setupApp(app: INestApplication, webOrigin: string): void {
  app.setGlobalPrefix('api')
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"]
        }
      }
    })
  )
  app.enableCors({ origin: webOrigin.split(','), exposedHeaders: ['x-request-id'] })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
}
