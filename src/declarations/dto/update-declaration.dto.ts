import { IsOptional, IsString, IsNumber, Matches, IsDate, IsIn, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { DeclarationItemDto } from './create-declaration.dto'

export class UpdateDeclarationDto {
  @IsOptional()
  @IsString()
  formType?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Period must be in format YYYY-MM' })
  period?: string

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'submitted', 'approved', 'rejected'])
  status?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  submittedDate?: Date

  @IsOptional()
  @IsNumber()
  totalIncome?: number

  @IsOptional()
  @IsNumber()
  totalExpenses?: number

  @IsOptional()
  @IsNumber()
  totalTax?: number

  @IsOptional()
  @IsString()
  documentUrl?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeclarationItemDto)
  items?: DeclarationItemDto[]
}
