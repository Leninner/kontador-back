import { IsDateString, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class NewCustomersQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string
}

export class GrowthRateQueryDto {
  @IsOptional()
  @IsEnum(['month', 'quarter', 'year'])
  periodType?: 'month' | 'quarter' | 'year' = 'month'
}

export class PeriodQueryDto {
  @IsOptional()
  @IsString()
  period?: string
}

export class ResponseTimeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lastDays?: number = 30
}
