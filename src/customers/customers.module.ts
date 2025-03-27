import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CustomersService } from './customers.service'
import { CustomersController } from './customers.controller'
import { Customer } from './entities/customer.entity'
import { User } from '../auth/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Customer, User])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
