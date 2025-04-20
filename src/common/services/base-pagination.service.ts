import { Repository, ObjectLiteral, SelectQueryBuilder, FindOptionsOrder, FindOptionsWhere } from 'typeorm'
import { PaginationDto } from '../dto/pagination.dto'
import { ApiResponseDto } from '../dto/api-response.dto'
import { PaginationService } from './pagination.service'

export abstract class BasePaginationService<Entity extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<Entity>) {}

  /**
   * Find all entities with pagination
   */
  protected async findAllWithPagination(
    paginationDto: PaginationDto,
    where: FindOptionsWhere<Entity> = {},
    order?: FindOptionsOrder<Entity>,
  ): Promise<ApiResponseDto<Entity[]>> {
    const result = await PaginationService.paginate(this.repository, where, paginationDto, order)

    return PaginationService.buildApiResponse<Entity>(result)
  }

  /**
   * Find all entities with pagination using QueryBuilder
   */
  protected async findAllWithQueryBuilder(
    queryBuilder: SelectQueryBuilder<Entity>,
    paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<Entity[]>> {
    const result = await PaginationService.paginateQueryBuilder(queryBuilder, paginationDto)

    return PaginationService.buildApiResponse<Entity>(result)
  }

  /**
   * Create a basic query builder with common options
   */
  protected createBaseQueryBuilder(
    alias: string,
    relations: Array<{ property: string; alias: string }> = [],
  ): SelectQueryBuilder<Entity> {
    const queryBuilder = this.repository.createQueryBuilder(alias)

    // Add joins for relations
    for (const relation of relations) {
      queryBuilder.leftJoin(`${alias}.${relation.property}`, relation.alias)
    }

    return queryBuilder
  }
}
