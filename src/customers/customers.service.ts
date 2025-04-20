import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { FindAllCustomersDto } from './dto/find-all-customers.dto'
import { User } from '../auth/entities/user.entity'
import { ApiErrorDto, ApiResponseDto } from '../common/dto/api-response.dto'
import * as Sentry from '@sentry/node'
import { BasePaginationService } from '../common/services/base-pagination.service'

@Injectable()
export class CustomersService extends BasePaginationService<Customer> {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super(customerRepository)
  }

  async create(createCustomerDto: CreateCustomerDto, accountant: User): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = this.customerRepository.create({
        ...createCustomerDto,
        accountant: { id: accountant.id } as User,
      })

      return new ApiResponseDto({
        success: true,
        data: await this.customerRepository.save(customer),
      })
    } catch (error) {
      Sentry.captureException(error)
      Sentry.captureMessage('Error creating customer', {
        level: 'error',
        extra: {
          createCustomerDto,
          accountant,
        },
      })

      return new ApiResponseDto({
        success: false,
        error: new ApiErrorDto({
          message: 'Error creating customer',
          code: 'CUSTOMER_CREATION_ERROR',
        }),
      })
    }
  }

  async findAll(accountant: User, findAllCustomersDto: FindAllCustomersDto): Promise<ApiResponseDto<Customer[]>> {
    const { name, documentId, page, limit } = findAllCustomersDto

    const queryBuilder = this.createBaseQueryBuilder('customer', [{ property: 'accountant', alias: 'accountant' }])

    queryBuilder.where('accountant.id = :accountantId', { accountantId: accountant.id })

    if (name) {
      queryBuilder.andWhere('customer.name ILIKE :name', { name: `%${name}%` })
    }

    if (documentId) {
      queryBuilder.andWhere('customer.documentId ILIKE :documentId', { documentId: `%${documentId}%` })
    }

    queryBuilder.orderBy('customer.deletedAt', 'ASC', 'NULLS FIRST').addOrderBy('customer.createdAt', 'DESC')

    return this.findAllWithQueryBuilder(queryBuilder, { page, limit })
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.accountant', 'accountant')
      .select(['customer', 'accountant.id'])
      .where('customer.id = :id', { id })
      .getOne()

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`)
    }

    return customer
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<ApiResponseDto<void>> {
    await this.findOne(id)

    await this.customerRepository
      .createQueryBuilder()
      .update(Customer)
      .set(updateCustomerDto)
      .where('id = :id', { id })
      .execute()

    return new ApiResponseDto({
      success: true,
    })
  }

  async remove(id: string): Promise<ApiResponseDto<void>> {
    await this.findOne(id)

    await this.customerRepository.createQueryBuilder().softDelete().where('id = :id', { id }).execute()

    return new ApiResponseDto({
      success: true,
    })
  }
}
