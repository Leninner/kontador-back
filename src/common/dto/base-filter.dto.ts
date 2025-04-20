import { IsOptional, IsString } from 'class-validator'
import { PaginationDto } from './pagination.dto'

export class BaseFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  sortBy?: string

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'
}
