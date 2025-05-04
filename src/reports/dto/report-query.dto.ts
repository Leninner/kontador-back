import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'
import { Period } from '../reports.service'

export class NewCustomersQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string
}

export class GrowthRateQueryDto {
  @IsOptional()
  @IsEnum(['month', 'quarter', 'year'])
  periodType?: Period

  @IsOptional()
  @IsString()
  period?: string
}

export class PeriodQueryDto {
  @IsOptional()
  @IsString()
  period?: string

  @IsOptional()
  @IsEnum(['month', 'quarter', 'year'])
  periodType?: Period
}

export class ResponseTimeQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  lastDays?: number = 30
}
