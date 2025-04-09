import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class EmailConfigDto {
  @IsOptional()
  @IsString()
  subject?: string

  @IsOptional()
  @IsString()
  customMessage?: string

  @IsOptional()
  @IsBoolean()
  useSendgrid?: boolean

  @IsOptional()
  @IsString()
  sendgridTemplateId?: string
}

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number

  @IsUUID()
  boardId: string

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
}
