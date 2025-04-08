import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string
}
