import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator'

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDateString()
  dueDate?: Date

  @IsOptional()
  @IsUUID()
  columnId?: string

  @IsOptional()
  @IsUUID()
  customerId?: string
}
