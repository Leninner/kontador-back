import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateCardDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDateString()
  dueDate?: Date

  @IsUUID()
  columnId: string

  @IsOptional()
  @IsUUID()
  customerId?: string
}
