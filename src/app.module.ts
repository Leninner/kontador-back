import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmailModule } from './common/services/email/email.module'
import { AuthModule } from './auth/auth.module'
import { CustomersModule } from './customers/customers.module'
import { BoardsModule } from './boards/boards.module'
import { SentryModule } from './common/services/sentry/sentry.module'
import { SentryInterceptor } from './common/interceptors/sentry.interceptor'
import { DeclarationsModule } from './declarations/declarations.module'
import { InvoicesModule } from './invoices/invoices.module'
import { ReportsModule } from './reports/reports.module'
import { OcrModule } from './ocr/ocr.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        logging: true,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    EmailModule,
    AuthModule,
    CustomersModule,
    BoardsModule,
    DeclarationsModule,
    InvoicesModule,
    ReportsModule,
    SentryModule,
    OcrModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}
