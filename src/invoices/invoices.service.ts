import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from './entities/invoice.entity'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { UpdateInvoiceDto } from './dto/update-invoice.dto'
import { FindInvoicesDto } from './dto/find-invoices.dto'
import { BasePaginationService } from '../common/services/base-pagination.service'
import { ApiResponseDto } from '../common/dto/api-response.dto'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const writeFileAsync = promisify(fs.writeFile)
const unlinkAsync = promisify(fs.unlink)

@Injectable()
export class InvoicesService extends BasePaginationService<Invoice> {
  private readonly uploadsFolder = path.join(process.cwd(), 'uploads', 'invoices')

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {
    super(invoiceRepository)
    // Ensure uploads directory exists
    this.ensureUploadsDirectory()
  }

  private ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsFolder)) {
      fs.mkdirSync(this.uploadsFolder, { recursive: true })
    }
  }

  async create(createInvoiceDto: CreateInvoiceDto, pdfFile?: any): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(createInvoiceDto)

    if (pdfFile) {
      const fileName = `invoice_${Date.now()}_${pdfFile.originalname}`
      const filePath = path.join(this.uploadsFolder, fileName)

      await writeFileAsync(filePath, pdfFile.buffer)

      // Save the URL for accessing the file
      invoice.pdfUrl = `/invoices/${invoice.id}/pdf`
    }

    return this.invoiceRepository.save(invoice)
  }

  async findAll(findInvoicesDto: FindInvoicesDto): Promise<ApiResponseDto<Invoice[]>> {
    const queryBuilder = this.createBaseQueryBuilder('invoice')

    if (findInvoicesDto.customerId) {
      queryBuilder.where('invoice.customerId = :customerId', {
        customerId: findInvoicesDto.customerId,
      })
    }

    if (findInvoicesDto.search) {
      queryBuilder.andWhere('(invoice.number ILIKE :search)', { search: `%${findInvoicesDto.search}%` })
    }

    // Apply sorting
    const sortBy = findInvoicesDto.sortBy || 'createdAt'
    const sortOrder = findInvoicesDto.sortOrder || 'DESC'
    queryBuilder.orderBy(`invoice.${sortBy}`, sortOrder)

    return this.findAllWithQueryBuilder(queryBuilder, findInvoicesDto)
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } })

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`)
    }

    return invoice
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, pdfFile?: any): Promise<Invoice> {
    const invoice = await this.findOne(id)

    Object.assign(invoice, updateInvoiceDto)

    if (pdfFile) {
      // Delete previous file if exists
      if (invoice.pdfUrl) {
        const oldFileName = path.basename(invoice.pdfUrl)
        const oldFilePath = path.join(this.uploadsFolder, oldFileName)

        if (fs.existsSync(oldFilePath)) {
          await unlinkAsync(oldFilePath)
        }
      }

      // Save new file
      const fileName = `invoice_${Date.now()}_${pdfFile.originalname}`
      const filePath = path.join(this.uploadsFolder, fileName)

      await writeFileAsync(filePath, pdfFile.buffer)

      // Update URL
      invoice.pdfUrl = `/invoices/${invoice.id}/pdf`
    }

    return this.invoiceRepository.save(invoice)
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id)

    // Delete file if exists
    if (invoice.pdfUrl) {
      const fileName = path.basename(invoice.pdfUrl)
      const filePath = path.join(this.uploadsFolder, fileName)

      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath)
      }
    }

    await this.invoiceRepository.softDelete(id)
  }

  async getPdfFile(id: string): Promise<{
    buffer: Buffer
    filename: string
    contentType: string
  }> {
    const invoice = await this.findOne(id)

    if (!invoice.pdfUrl) {
      throw new NotFoundException('PDF file not found for this invoice')
    }

    const fileName = path.basename(invoice.pdfUrl)
    const filePath = path.join(this.uploadsFolder, fileName)

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('PDF file not found')
    }

    const buffer = fs.readFileSync(filePath)

    return {
      buffer,
      filename: fileName,
      contentType: 'application/pdf',
    }
  }
}
