import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers/customers.module'
import { InvoicesModule } from '../invoices/invoices.module'
import { DeclarationsModule } from '../declarations/declarations.module'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { Customer } from '../customers/entities/customer.entity'
import { Invoice } from '../invoices/entities/invoice.entity'
import { Declaration } from '../declarations/entities/declaration.entity'
import { Board } from '../boards/entities/board.entity'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    CustomersModule,
    InvoicesModule,
    DeclarationsModule,
    TypeOrmModule.forFeature([Customer, Invoice, Declaration, Board]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
