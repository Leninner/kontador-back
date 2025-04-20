import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator'
import { BaseFilterDto } from '../../common/dto/base-filter.dto'

export class FindDeclarationsDto extends BaseFilterDto {
  @IsOptional()
  @IsUUID()
  customerId?: string

  @IsOptional()
  @IsString()
  formType?: string

  @IsOptional()
  @IsString()
  period?: string

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'submitted', 'approved', 'rejected'])
  status?: string
}
