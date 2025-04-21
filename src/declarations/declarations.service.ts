import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Declaration } from './entities/declaration.entity'
import { CreateDeclarationDto } from './dto/create-declaration.dto'
import { UpdateDeclarationDto } from './dto/update-declaration.dto'
import { FindDeclarationsDto } from './dto/find-declarations.dto'

@Injectable()
export class DeclarationsService {
  constructor(
    @InjectRepository(Declaration)
    private declarationsRepository: Repository<Declaration>,
  ) {}

  async create(createDeclarationDto: CreateDeclarationDto): Promise<Declaration> {
    const declaration = this.declarationsRepository.create({
      ...createDeclarationDto,
      status: 'draft',
    })

    return this.declarationsRepository.save(declaration)
  }

  async findAll(findDeclarationsDto: FindDeclarationsDto) {
    const queryBuilder = this.declarationsRepository.createQueryBuilder('declaration')

    // Apply filters if provided
    if (findDeclarationsDto.customerId) {
      queryBuilder.andWhere('declaration.customerId = :customerId', {
        customerId: findDeclarationsDto.customerId,
      })
    }

    if (findDeclarationsDto.formType) {
      queryBuilder.andWhere('declaration.formType = :formType', {
        formType: findDeclarationsDto.formType,
      })
    }

    if (findDeclarationsDto.period) {
      queryBuilder.andWhere('declaration.period = :period', {
        period: findDeclarationsDto.period,
      })
    }

    if (findDeclarationsDto.status) {
      queryBuilder.andWhere('declaration.status = :status', {
        status: findDeclarationsDto.status,
      })
    }

    if (findDeclarationsDto.search) {
      queryBuilder.andWhere('(declaration.formType ILIKE :search OR declaration.period ILIKE :search)', {
        search: `%${findDeclarationsDto.search}%`,
      })
    }

    const sortBy = findDeclarationsDto.sortBy || 'createdAt'
    const sortOrder = findDeclarationsDto.sortOrder || 'DESC'
    queryBuilder.orderBy(`declaration.${sortBy}`, sortOrder)

    const page = findDeclarationsDto.page || 1
    const limit = findDeclarationsDto.limit || 10
    const skip = (page - 1) * limit

    queryBuilder.skip(skip).take(limit)

    const [declarations, total] = await queryBuilder.getManyAndCount()

    return {
      data: declarations.map((declaration) => {
        return {
          ...declaration,
          totalTax: Number(declaration.totalTax),
          totalExpenses: Number(declaration.totalExpenses),
          totalIncome: Number(declaration.totalIncome),
        }
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string): Promise<Declaration> {
    const declaration = await this.declarationsRepository.findOne({ where: { id } })

    if (!declaration) {
      throw new NotFoundException(`Declaration with ID ${id} not found`)
    }

    return declaration
  }

  async update(id: string, updateDeclarationDto: UpdateDeclarationDto): Promise<Declaration> {
    const declaration = await this.findOne(id)

    Object.assign(declaration, updateDeclarationDto)

    return this.declarationsRepository.save(declaration)
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)

    await this.declarationsRepository.softDelete(id)
  }
}
