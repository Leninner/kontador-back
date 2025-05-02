import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Invoice } from './entities/invoice.entity'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { UpdateInvoiceDto } from './dto/update-invoice.dto'
import { FindInvoicesDto } from './dto/find-invoices.dto'
import { BasePaginationService } from '../common/services/base-pagination.service'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Injectable()
export class InvoicesService extends BasePaginationService<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {
    super(invoiceRepository)
  }
  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(createInvoiceDto)

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

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(id)

    Object.assign(invoice, updateInvoiceDto)

    return this.invoiceRepository.save(invoice)
  }

  async remove(id: string): Promise<void> {
    await this.invoiceRepository.softDelete(id)
  }
}
