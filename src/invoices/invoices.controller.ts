import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { InvoicesService } from './invoices.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { UpdateInvoiceDto } from './dto/update-invoice.dto'
import { FindInvoicesDto } from './dto/find-invoices.dto'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('pdfFile'))
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @UploadedFile() pdfFile: Express.Multer.File) {
    if (!pdfFile) {
      throw new BadRequestException('PDF file is required')
    }

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

    const data = await this.invoicesService.create(createInvoiceDto, pdfFile)
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
  @UseInterceptors(FileInterceptor('pdfFile'))
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @UploadedFile() pdfFile?: Express.Multer.File,
  ) {
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

    const data = await this.invoicesService.update(id, updateInvoiceDto, pdfFile)
    return new ApiResponseDto({ success: true, data })
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.invoicesService.remove(id)
    return new ApiResponseDto({ success: true })
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const file = await this.invoicesService.getPdfFile(id)

    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    })

    res.send(file.buffer)
  }
}
