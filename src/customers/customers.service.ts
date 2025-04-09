import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { FindAllCustomersDto } from './dto/find-all-customers.dto'
import { User } from '../auth/entities/user.entity'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

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
      if (error.code === '23505') {
        throw new ConflictException('Customer already exists')
      }

      throw error
    }
  }

  async findAll(
    accountant: User,
    { name, documentId, page, limit }: FindAllCustomersDto,
  ): Promise<ApiResponseDto<Customer[]>> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.accountant', 'accountant')
      .where('accountant.id = :accountantId', { accountantId: accountant.id })

    if (name) {
      queryBuilder.andWhere('customer.name ILIKE :name', { name: `%${name}%` })
    }

    if (documentId) {
      queryBuilder.andWhere('customer.documentId ILIKE :documentId', { documentId: `%${documentId}%` })
    }

    queryBuilder.orderBy('customer.deletedAt', 'ASC', 'NULLS FIRST').addOrderBy('customer.createdAt', 'DESC')

    const [items, total] = await queryBuilder
      .take(limit || 10)
      .skip(((page || 1) - 1) * (limit || 10))
      .getManyAndCount()

    return new ApiResponseDto({
      success: true,
      data: items,
      meta: {
        page: page || 1,
        limit: limit || 10,
        total,
        totalPages: Math.ceil(total / (limit || 10)),
      },
    })
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
