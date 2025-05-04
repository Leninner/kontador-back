import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../auth/entities/user.entity'
import { ApiResponseDto } from '../common/dto/api-response.dto'
import { NewCustomersQueryDto, GrowthRateQueryDto, PeriodQueryDto, ResponseTimeQueryDto } from './dto/report-query.dto'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('new-customers')
  async getNewCustomers(@CurrentUser() user: User, @Query() query: NewCustomersQueryDto) {
    const fromDateObj = query.fromDate
      ? new Date(query.fromDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1))
    const data = await this.reportsService.getNewCustomers(user.id, fromDateObj)

    return new ApiResponseDto({
      success: true,
      data,
    })
  }

  @Get('growth-rate')
  async getCustomerGrowthRate(@CurrentUser() user: User, @Query() query: GrowthRateQueryDto) {
    const data = await this.reportsService.getCustomerGrowthRate(user.id, query.periodType, query.period)

    return new ApiResponseDto({
      success: true,
      data,
    })
  }

  @Get('invoice-statistics')
  async getInvoiceStatistics(@CurrentUser() user: User, @Query() query: PeriodQueryDto) {
    let period = query.period
    if (!period) {
      const now = new Date()
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    const data = await this.reportsService.getInvoiceStatistics(user.id, query.periodType, period)

    return new ApiResponseDto({
      success: true,
      data,
    })
  }

  @Get('compliance-rate')
  async getDeclarationComplianceRate(@CurrentUser() user: User, @Query() query: PeriodQueryDto) {
    let period = query.period
    if (!period) {
      const now = new Date()
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    const data = await this.reportsService.getDeclarationComplianceRate(user.id, query.periodType, period)

    return new ApiResponseDto({
      success: true,
      data,
    })
  }

  @Get('response-time')
  async getAverageResponseTime(@CurrentUser() user: User, @Query() query: ResponseTimeQueryDto) {
    const data = await this.reportsService.getAverageResponseTime(user.id, query.lastDays)

    return new ApiResponseDto({
      success: true,
      data,
    })
  }
}
