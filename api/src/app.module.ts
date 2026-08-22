import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { Env, validateEnv } from './config/env'
import { dataSourceOptions } from './database/data-source'
import { AccountsModule } from './modules/accounts/accounts.module'
import { AuthModule } from './modules/auth/auth.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { HealthController } from './modules/health/health.controller'
import { ImportsModule } from './modules/imports/imports.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { RealtimeModule } from './modules/realtime/realtime.module'
import { ReportsModule } from './modules/reports/reports.module'
import { RulesModule } from './modules/rules/rules.module'
import { TelemetryController } from './modules/telemetry/telemetry.controller'
import { TransactionsModule } from './modules/transactions/transactions.module'

const isTest = process.env.NODE_ENV === 'test'
const isProd = process.env.NODE_ENV === 'production'
const webDist = process.env.WEB_DIST ?? join(__dirname, '..', '..', 'web', 'dist')
const serveWeb = isProd && existsSync(webDist)

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, ignoreEnvFile: isTest }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isTest ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) || randomUUID()
          res.setHeader('x-request-id', id)
          return id
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/api/health' },
        transport: isProd || isTest ? undefined : { target: 'pino-pretty', options: { singleLine: true } }
      }
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => dataSourceOptions(config.get('DATABASE_URL'))
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({ secret: config.get('JWT_SECRET'), signOptions: { expiresIn: '7d' } })
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: isTest ? 10_000 : 300 }]),
    EventEmitterModule.forRoot(),
    ...(isTest ? [] : [ScheduleModule.forRoot()]),
    ...(serveWeb ? [ServeStaticModule.forRoot({ rootPath: webDist, exclude: ['/api/(.*)'] })] : []),
    RealtimeModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    RulesModule,
    ImportsModule,
    ReportsModule,
    NotificationsModule
  ],
  controllers: [HealthController, TelemetryController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard }
  ]
})
export class AppModule {}
