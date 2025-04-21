import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

export class DeclarationItemDto {
  @IsNotEmpty()
  @IsString()
  code: string

  @IsNotEmpty()
  @IsString()
  description: string

  @IsNotEmpty()
  @IsNumber()
  amount: number

  @IsOptional()
  @IsNumber()
  taxPercentage?: number

  @IsOptional()
  @IsNumber()
  taxAmount?: number

  @IsNotEmpty()
  @IsString()
  @IsIn(['income', 'expense', 'tax', 'info'])
  type: 'income' | 'expense' | 'tax' | 'info'
}

export class CreateDeclarationDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string

  @IsNotEmpty()
  @IsString()
  formType: string

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Period must be in format YYYY-MM' })
  period: string

  @IsOptional()
  @IsString()
  documentUrl?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeclarationItemDto)
  items?: DeclarationItemDto[]
}
