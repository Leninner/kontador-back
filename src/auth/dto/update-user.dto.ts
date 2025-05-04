import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsNumberString, IsNumber } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no debe exceder 50 caracteres' })
  name?: string

  @IsOptional()
  @IsEmail({}, { message: 'Por favor, proporciona un email válido' })
  email?: string

  @IsOptional()
  @IsString()
  @IsNumberString({}, { message: 'El número de teléfono debe contener solo números' })
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxIdentificationNumber?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string

  @IsOptional()
  @IsString()
  languages?: string // Stored as comma separated values

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number
}
