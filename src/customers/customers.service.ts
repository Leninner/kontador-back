import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindOptionsWhere } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { FindAllCustomersDto } from './dto/find-all-customers.dto'
import { User } from '../auth/entities/user.entity'
import { PaginationService } from '../common/services/pagination.service'
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
        accountant,
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
    const where: FindOptionsWhere<Customer> = { accountant: { id: accountant.id } }

    if (name) {
      where.name = Like(`%${name}%`)
    }

    if (documentId) {
      where.documentId = Like(`%${documentId}%`)
    }

    const data = await PaginationService.paginate(
      this.customerRepository,
      where,
      { page, limit },
      {
        deletedAt: 'ASC',
        createdAt: 'DESC',
      },
    )

    return new ApiResponseDto({
      success: true,
      ...data,
    })
  }

  async findOne(id: string): Promise<ApiResponseDto<Customer>> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    })

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`)
    }

    return new ApiResponseDto({
      success: true,
      data: customer,
    })
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<ApiResponseDto<void>> {
    const customer = await this.findOne(id)
    Object.assign(customer, updateCustomerDto)
    await this.customerRepository.save({ ...customer, ...updateCustomerDto })

    return new ApiResponseDto({
      success: true,
    })
  }

  async remove(id: string): Promise<ApiResponseDto<void>> {
    await this.findOne(id)
    await this.customerRepository.softDelete(id)

    return new ApiResponseDto({
      success: true,
    })
  }
}
