import { IsOptional, IsString } from 'class-validator'
import { BaseFilterDto } from '../../common/dto/base-filter.dto'

export class FindAllCustomersDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  documentId?: string
}
