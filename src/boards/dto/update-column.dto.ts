import { IsString, IsOptional, IsNumber, IsObject, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateColumnRulesDto } from './create-column-rules.dto'

export class UpdateColumnDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  order?: number

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateColumnRulesDto)
  rules?: CreateColumnRulesDto

  @IsString()
  @IsOptional()
  color?: string
}
