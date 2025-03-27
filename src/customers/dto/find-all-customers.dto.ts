import { IsOptional, IsString } from 'class-validator'
import { SearchDto } from '../../common/dto/search.dto'

export class FindAllCustomersDto extends SearchDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  documentId?: string
}
