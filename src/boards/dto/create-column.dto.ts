import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number

  @IsUUID()
  boardId: string
}
