import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { CardPriority } from '../entities/card.entity'

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

  @IsOptional()
  @IsEnum(CardPriority)
  priority?: CardPriority
}
