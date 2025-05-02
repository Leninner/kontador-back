import { forwardRef, Module } from '@nestjs/common'
import { ProcessWebhookService } from './infrastructure/services/ProcessWebhookService'
import { OpenAiOcrRepository } from './infrastructure/openai/OpenAiOcrRepository'
import { TransformImage } from './application/services/TransformImage'
import { BoardsModule } from '../boards/boards.module'
import { AuthModule } from '../auth/auth.module'
import { InvoicesModule } from '../invoices/invoices.module'
import { CustomersModule } from '../customers/customers.module'
import { ConfigModule } from '@nestjs/config'
import { WhatsappModule } from '../whatsapp/whatsapp.module'

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => BoardsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => WhatsappModule),
  ],
  providers: [
    ProcessWebhookService,
    OpenAiOcrRepository,
    TransformImage,
    {
      provide: 'defaultUser',
      useValue: { id: process.env.DEFAULT_SYSTEM_USER_ID || '00000000-0000-0000-0000-000000000000' },
    },
  ],
  exports: [ProcessWebhookService, OpenAiOcrRepository, TransformImage],
})
export class OcrModule {}
