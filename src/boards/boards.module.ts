import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Board } from './entities/board.entity'
import { BoardsService } from './boards.service'
import { BoardsController } from './boards.controller'
import { CardHistory } from './entities/card-history.entity'
import { Card } from './entities/card.entity'
import { Column } from './entities/column.entity'
import { Comment } from './entities/comment.entity'
import { CustomersModule } from '../customers/customers.module'
import { CardNotificationService } from './services/card-notification.service'
import { EmailModule } from '../common/services/email/email.module'
import { MailService } from './services/mail.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, Column, Card, Comment, CardHistory]),
    forwardRef(() => CustomersModule),
    forwardRef(() => AuthModule),
    EmailModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, CardNotificationService, MailService],
  exports: [BoardsService],
})
export class BoardsModule {}
