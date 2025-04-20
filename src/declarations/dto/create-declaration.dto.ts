import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator'

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
}
