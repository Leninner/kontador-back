import { IsOptional, IsUUID } from 'class-validator'
import { BaseFilterDto } from '../../common/dto/base-filter.dto'

export class FindInvoicesDto extends BaseFilterDto {
  @IsOptional()
  @IsUUID()
  customerId?: string
}
