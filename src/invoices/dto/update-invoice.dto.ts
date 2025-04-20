import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  number?: string

  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsNumber()
  amount?: number

  @IsOptional()
  @IsNumber()
  tax?: number

  @IsOptional()
  @IsNumber()
  iva?: number
}
