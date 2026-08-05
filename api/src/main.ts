import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { setupApp } from './setup-app'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  app.enableShutdownHooks()
  setupApp(app, process.env.WEB_ORIGIN ?? 'http://localhost:5173')

  const config = new DocumentBuilder()
    .setTitle('Tostão API')
    .setDescription('Finanças pessoais com importação de extratos (Nubank CSV, OFX e CSV genérico)')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(Number(process.env.PORT ?? 3000))
}

void bootstrap()
