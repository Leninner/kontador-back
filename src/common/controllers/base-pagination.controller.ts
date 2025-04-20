import { ApiResponseDto } from '../dto/api-response.dto'
import { PaginationDto } from '../dto/pagination.dto'
import { Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { PaginationService } from '../services/pagination.service'

export abstract class BasePaginationController<Entity extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<Entity>) {}

  /**
   * Apply pagination to a repository query
   */
  protected async paginateRepository(
    where: any,
    paginationDto: PaginationDto,
    order?: any,
  ): Promise<ApiResponseDto<Entity[]>> {
    const result = await PaginationService.paginate(this.repository, where, paginationDto, order)

    return PaginationService.buildApiResponse<Entity>(result)
  }

  /**
   * Apply pagination to a query builder
   */
  protected async paginateQueryBuilder(
    queryBuilder: SelectQueryBuilder<Entity>,
    paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<Entity[]>> {
    const result = await PaginationService.paginateQueryBuilder(queryBuilder, paginationDto)

    return PaginationService.buildApiResponse<Entity>(result)
  }
}
