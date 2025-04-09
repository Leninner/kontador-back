import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as Sentry from '@sentry/node'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SENTRY',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        Sentry.init({
          dsn: configService.get('SENTRY_DSN'),
          environment: configService.get('NODE_ENV'),
          integrations: [Sentry.onUncaughtExceptionIntegration(), Sentry.onUnhandledRejectionIntegration()],
        })
        return Sentry
      },
    },
  ],
  exports: ['SENTRY'],
})
export class SentryModule {}
