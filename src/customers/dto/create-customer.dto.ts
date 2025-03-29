import { IsString, IsEnum, IsNotEmpty, MinLength, IsEmail } from 'class-validator'
import { DocumentType } from '../entities/customer.entity'

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string

  @IsEnum(DocumentType)
  documentType: DocumentType

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  documentId: string

  @IsEmail()
  @IsNotEmpty()
  email: string
}
