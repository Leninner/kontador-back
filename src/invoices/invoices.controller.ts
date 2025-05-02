import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { UpdateInvoiceDto } from './dto/update-invoice.dto'
import { FindInvoicesDto } from './dto/find-invoices.dto'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    // Convert numeric strings to numbers for validation
    if (typeof createInvoiceDto.amount === 'string') {
      createInvoiceDto.amount = parseFloat(createInvoiceDto.amount)
    }

    if (typeof createInvoiceDto.tax === 'string') {
      createInvoiceDto.tax = parseFloat(createInvoiceDto.tax)
    }

    if (typeof createInvoiceDto.iva === 'string') {
      createInvoiceDto.iva = parseFloat(createInvoiceDto.iva)
    }

    const data = await this.invoicesService.create(createInvoiceDto)
    return new ApiResponseDto({ success: true, data })
  }

  @Get()
  async findAll(@Query() findInvoicesDto: FindInvoicesDto) {
    const result = await this.invoicesService.findAll(findInvoicesDto)
    return result
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.invoicesService.findOne(id)
    return new ApiResponseDto({ success: true, data })
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    // Convert numeric strings to numbers for validation
    if (typeof updateInvoiceDto.amount === 'string') {
      updateInvoiceDto.amount = parseFloat(updateInvoiceDto.amount)
    }

    if (typeof updateInvoiceDto.tax === 'string') {
      updateInvoiceDto.tax = parseFloat(updateInvoiceDto.tax)
    }

    if (typeof updateInvoiceDto.iva === 'string') {
      updateInvoiceDto.iva = parseFloat(updateInvoiceDto.iva)
    }

    const data = await this.invoicesService.update(id, updateInvoiceDto)
    return new ApiResponseDto({ success: true, data })
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.invoicesService.remove(id)
    return new ApiResponseDto({ success: true })
  }
}
