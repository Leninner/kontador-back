import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { EmailConfigDto } from './create-column.dto'

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

  @IsBoolean()
  @IsOptional()
  sendEmailOnCardEntry?: boolean

  @IsString()
  @IsOptional()
  emailTemplateName?: string

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  emailConfig?: EmailConfigDto

  @IsString()
  @IsOptional()
  color?: string
}
