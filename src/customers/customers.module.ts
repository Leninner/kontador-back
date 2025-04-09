import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomersService } from './customers.service'
import { CustomersController } from './customers.controller'
import { Customer } from './entities/customer.entity'
import { User } from '../auth/entities/user.entity'
import { BoardsModule } from '../boards/boards.module'

@Module({
  imports: [TypeOrmModule.forFeature([Customer, User]), forwardRef(() => BoardsModule)],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
