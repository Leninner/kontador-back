import { IsString, IsEnum, IsNotEmpty, MinLength, IsEmail } from 'class-validator'
import { DocumentType } from '../entities/customer.entity'
import { IsValidDocument } from '../../common/dto/validators/document-validator.decorator'

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
  @IsValidDocument()
  documentId: string

  @IsEmail()
  @IsNotEmpty()
  email: string
}
