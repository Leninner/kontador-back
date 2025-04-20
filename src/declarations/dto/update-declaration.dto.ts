import { IsOptional, IsString, IsNumber, Matches, IsDate, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

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
}
