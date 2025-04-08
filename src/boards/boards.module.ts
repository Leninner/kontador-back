import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Board } from './entities/board.entity'
import { BoardsService } from './boards.service'
import { BoardsController } from './boards.controller'
import { CardHistory } from './entities/card-history.entity'
import { Card } from './entities/card.entity'
import { Column } from './entities/column.entity'
import { Comment } from './entities/comment.entity'
import { CustomersService } from '../customers/customers.service'
import { Customer } from '../customers/entities/customer.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Board, Column, Card, Comment, CardHistory, Customer])],
  controllers: [BoardsController],
  providers: [BoardsService, CustomersService],
  exports: [BoardsService],
})
export class BoardsModule {}
