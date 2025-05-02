import { forwardRef, Module } from '@nestjs/common'
import { TwilioWhatsappRepository } from './infrastructure/TwilioWhatsappRepository'
import { ProcessImageMessage } from './application/services/ProcessImageMessage'
import { ProcessIncomingMessage } from './application/usecases/ProcessIncomingMessage'
import { ConfigModule } from '@nestjs/config'
import { OpenAiOcrRepository } from '../ocr/infrastructure/openai/OpenAiOcrRepository'
import { TransformImage } from '../ocr/application/services/TransformImage'
import { WhatsappRepository } from './domain/WhatsappRepository'
import { InvoicesService } from '../invoices/invoices.service'
import { CustomersService } from '../customers/customers.service'
import { UserService } from '../auth/services/user.service'
import { WhatsappTaskService } from '../boards/services/whatsapp-task.service'
import { Invoice } from '../invoices/entities/invoice.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Card } from '../boards/entities/card.entity'
import { User } from '../auth/entities/user.entity'
import { Customer } from '../customers/entities/customer.entity'
import { Board } from '../boards/entities/board.entity'
import { Column } from '../boards/entities/column.entity'
import { Task } from 'twilio/lib/twiml/VoiceResponse'
import { BoardsService } from '../boards/boards.service'
import { Comment } from '../boards/entities/comment.entity'
import { CardHistory } from '../boards/entities/card-history.entity'
import { ColumnRulesService } from '../boards/services/column-rules.service'
import { MailService } from '../boards/services/mail.service'
import { EmailService } from '../common/services/email/email.service'
import { TemplateService } from '../common/services/email/template.service'
import { TemplateValidatorService } from '../common/services/email/template-validator.service'
import { SendGridAdapter } from '../common/services/email/sendgrid.adapter'
import { CustomersModule } from '../customers/customers.module'
import { InvoicesModule } from '../invoices/invoices.module'
import { OcrModule } from '../ocr/ocr.module'
import { BoardsModule } from '../boards/boards.module'
import { AuthModule } from '../auth/auth.module'
import { OpenAiMessageRepository } from './infrastructure/OpenAiMessageRepository'
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Invoice, Customer, User, Card, Board, Column, Task, Comment, CardHistory]),
    forwardRef(() => CustomersModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => OcrModule),
    forwardRef(() => BoardsModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    SendGridAdapter,
    ColumnRulesService,
    TemplateValidatorService,
    MailService,
    EmailService,
    TemplateService,
    BoardsService,
    TwilioWhatsappRepository,
    {
      provide: WhatsappRepository,
      useClass: TwilioWhatsappRepository,
    },
    ProcessImageMessage,
    ProcessIncomingMessage,
    OpenAiOcrRepository,
    TransformImage,
    InvoicesService,
    CustomersService,
    UserService,
    WhatsappTaskService,
    OpenAiMessageRepository,
  ],
  exports: [
    TwilioWhatsappRepository,
    ProcessImageMessage,
    ProcessIncomingMessage,
    OpenAiOcrRepository,
    WhatsappRepository,
  ],
})
export class WhatsappModule {}
