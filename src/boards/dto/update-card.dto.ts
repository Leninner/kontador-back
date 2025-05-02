import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { CardPriority } from '../entities/card.entity'

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

  @IsOptional()
  @IsEnum(CardPriority)
  priority?: CardPriority
}
