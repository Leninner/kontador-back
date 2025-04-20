import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator'

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string

  @IsNotEmpty()
  @IsString()
  number: string

  @IsNotEmpty()
  @IsDateString()
  date: string

  @IsNotEmpty()
  @IsNumber()
  amount: number

  @IsNotEmpty()
  @IsNumber()
  tax: number

  @IsNotEmpty()
  @IsNumber()
  iva: number
}
