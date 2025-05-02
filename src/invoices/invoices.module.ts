import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InvoicesController } from './invoices.controller'
import { InvoicesService } from './invoices.service'
import { Invoice } from './entities/invoice.entity'
import { WhatsappModule } from '../whatsapp/whatsapp.module'

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), forwardRef(() => WhatsappModule)],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
