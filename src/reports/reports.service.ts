import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, In, Repository } from 'typeorm'
import { Customer } from '../customers/entities/customer.entity'
import { Invoice } from '../invoices/entities/invoice.entity'
import { Declaration } from '../declarations/entities/declaration.entity'
import { Board } from '../boards/entities/board.entity'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  formatDate,
  endOfYear,
  startOfYear,
  endOfQuarter,
  startOfQuarter,
  subQuarters,
  subYears,
} from 'date-fns'

export type Period = 'month' | 'quarter' | 'year'

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Declaration)
    private readonly declarationRepository: Repository<Declaration>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async getNewCustomers(accountantId: string, fromDate: Date): Promise<any> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.accountant = :accountantId', { accountantId })
      .andWhere('customer.createdAt >= :fromDate', { fromDate })
      .orderBy('customer.createdAt', 'DESC')

    const customers = await queryBuilder.getMany()

    return {
      totalNewCustomers: customers.length,
      customers,
    }
  }

  async getCustomerGrowthRate(accountantId: string, periodType: Period = 'month', period?: string): Promise<any> {
    const now = new Date()
    let currentPeriodStart: Date
    let previousPeriodStart: Date
    let currentPeriodEnd: Date
    let previousPeriodEnd: Date

    // If a specific period is provided, parse it
    if (period) {
      const [year, month] = period.split('-').map(Number)

      if (periodType === 'month') {
        currentPeriodStart = new Date(year, month - 1, 1)
        currentPeriodEnd = endOfMonth(currentPeriodStart)
        previousPeriodStart = startOfMonth(subMonths(currentPeriodStart, 1))
        previousPeriodEnd = endOfMonth(subMonths(currentPeriodStart, 1))
      } else if (periodType === 'quarter') {
        // Calculate the quarter based on the month
        const quarterStartMonth = Math.floor((month - 1) / 3) * 3
        currentPeriodStart = new Date(year, quarterStartMonth, 1)
        currentPeriodEnd = endOfQuarter(currentPeriodStart)
        previousPeriodStart = startOfQuarter(subQuarters(currentPeriodStart, 1))
        previousPeriodEnd = endOfQuarter(subQuarters(currentPeriodStart, 1))
      } else {
        currentPeriodStart = new Date(year, 0, 1)
        currentPeriodEnd = endOfYear(currentPeriodStart)
        previousPeriodStart = startOfYear(subYears(currentPeriodStart, 1))
        previousPeriodEnd = endOfYear(subYears(currentPeriodStart, 1))
      }
    } else {
      // Use current date if no specific period is provided
      if (periodType === 'month') {
        currentPeriodStart = startOfMonth(now)
        currentPeriodEnd = endOfMonth(now)
        previousPeriodStart = startOfMonth(subMonths(now, 1))
        previousPeriodEnd = endOfMonth(subMonths(now, 1))
      } else if (periodType === 'quarter') {
        currentPeriodStart = startOfQuarter(now)
        currentPeriodEnd = endOfQuarter(now)
        previousPeriodStart = startOfQuarter(subQuarters(now, 1))
        previousPeriodEnd = endOfQuarter(subQuarters(now, 1))
      } else {
        currentPeriodStart = startOfYear(now)
        currentPeriodEnd = endOfYear(now)
        previousPeriodStart = startOfYear(subYears(now, 1))
        previousPeriodEnd = endOfYear(subYears(now, 1))
      }
    }

    const currentPeriodCustomers = await this.customerRepository.count({
      where: {
        accountant: { id: accountantId },
        createdAt: Between(currentPeriodStart, currentPeriodEnd),
      },
    })

    const previousPeriodCustomers = await this.customerRepository.count({
      where: {
        accountant: { id: accountantId },
        createdAt: Between(previousPeriodStart, previousPeriodEnd),
      },
    })

    let growthRate = 0
    if (previousPeriodCustomers > 0) {
      growthRate = ((currentPeriodCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100
    } else if (currentPeriodCustomers > 0) {
      growthRate = 100 // If there were no customers before and now there are, it's 100% growth
    }

    return {
      currentPeriod: {
        start: formatDate(currentPeriodStart, 'yyyy-MM-dd'),
        end: formatDate(currentPeriodEnd, 'yyyy-MM-dd'),
        customers: currentPeriodCustomers,
      },
      previousPeriod: {
        start: formatDate(previousPeriodStart, 'yyyy-MM-dd'),
        end: formatDate(previousPeriodEnd, 'yyyy-MM-dd'),
        customers: previousPeriodCustomers,
      },
      growthRate: parseFloat(growthRate.toFixed(2)),
    }
  }

  async getInvoiceStatistics(accountantId: string, periodType: Period = 'month', period?: string): Promise<any> {
    let periodStart: Date
    let periodEnd: Date
    const now = new Date()

    if (period) {
      const [year, month] = period.split('-').map(Number)

      if (periodType === 'month') {
        periodStart = new Date(year, month - 1, 1)
        periodEnd = endOfMonth(periodStart)
      } else if (periodType === 'quarter') {
        const quarterStartMonth = Math.floor((month - 1) / 3) * 3
        periodStart = new Date(year, quarterStartMonth, 1)
        periodEnd = endOfQuarter(periodStart)
      } else {
        periodStart = new Date(year, 0, 1)
        periodEnd = endOfYear(periodStart)
      }
    } else {
      if (periodType === 'month') {
        periodStart = startOfMonth(now)
        periodEnd = endOfMonth(now)
      } else if (periodType === 'quarter') {
        periodStart = startOfQuarter(now)
        periodEnd = endOfQuarter(now)
      } else {
        periodStart = startOfYear(now)
        periodEnd = endOfYear(now)
      }
    }

    const customers = await this.customerRepository.find({
      where: { accountant: { id: accountantId } },
      select: ['id'],
    })
    const customerIds = customers.map((customer) => customer.id)

    const invoices = await this.invoiceRepository.find({
      where: {
        customerId: In(customerIds),
        date: Between(formatDate(periodStart, 'yyyy-MM-dd'), formatDate(periodEnd, 'yyyy-MM-dd')),
      },
    })

    const totalInvoices = invoices.length
    const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0)
    const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0
    const totalTax = invoices.reduce((sum, invoice) => sum + Number(invoice.tax), 0)
    const totalIva = invoices.reduce((sum, invoice) => sum + Number(invoice.iva), 0)

    return {
      period,
      periodType,
      periodRange: {
        start: formatDate(periodStart, 'yyyy-MM-dd'),
        end: formatDate(periodEnd, 'yyyy-MM-dd'),
      },
      totalInvoices,
      totalAmount,
      averageAmount,
      totalTax,
      totalIva,
    }
  }

  async getDeclarationComplianceRate(
    accountantId: string,
    periodType: Period = 'month',
    period?: string,
  ): Promise<any> {
    // Get all customers for this accountant
    const customers = await this.customerRepository.find({
      where: { accountant: { id: accountantId } },
      select: ['id'],
    })

    const customerIds = customers.map((customer) => customer.id)
    const totalCustomers = customerIds.length

    // Find all declarations for these customers in the given period
    const declarations = await this.declarationRepository.find({
      where: {
        customerId: In(customerIds),
        period,
      },
    })

    const submittedDeclarations = declarations.filter(
      (declaration) => declaration.status === 'submitted' || declaration.status === 'approved',
    )

    const complianceRate = totalCustomers > 0 ? (submittedDeclarations.length / totalCustomers) * 100 : 0

    return {
      period,
      periodType,
      totalCustomers,
      submittedDeclarations: submittedDeclarations.length,
      complianceRate: parseFloat(complianceRate.toFixed(2)),
    }
  }

  async getAverageResponseTime(accountantId: string, lastDays: number = 30): Promise<any> {
    const cutoffDate = subDays(new Date(), lastDays)

    // Get all cards with comments in the specified period
    const queryBuilder = this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.columns', 'column')
      .leftJoinAndSelect('column.cards', 'card')
      .leftJoinAndSelect('card.comments', 'comment')
      .where('board.userId = :accountantId', { accountantId })
      .andWhere('comment.createdAt >= :cutoffDate', { cutoffDate })
      .orderBy('card.id', 'ASC')
      .addOrderBy('comment.createdAt', 'ASC')

    const boardData = await queryBuilder.getOne()

    if (!boardData || !boardData.columns) {
      return {
        averageResponseTime: 0,
        totalCards: 0,
        analyzedCards: 0,
      }
    }

    const responseTimes: number[] = []
    let analyzedCards = 0

    // Process all cards and their comments
    boardData.columns.forEach((column) => {
      if (!column.cards) return

      column.cards.forEach((card) => {
        if (!card.comments || card.comments.length < 2) return

        // Sort comments by creation date
        const sortedComments = [...card.comments].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )

        // Calculate response times between consecutive comments
        for (let i = 1; i < sortedComments.length; i++) {
          const timeElapsed =
            new Date(sortedComments[i].createdAt).getTime() - new Date(sortedComments[i - 1].createdAt).getTime()
          // Convert to hours
          const hoursElapsed = timeElapsed / (1000 * 60 * 60)
          responseTimes.push(hoursElapsed)
        }

        analyzedCards++
      })
    })

    const averageResponseTime =
      responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

    return {
      averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      averageResponseTimeInHours: parseFloat(averageResponseTime.toFixed(2)),
      totalCards: boardData.columns.reduce((sum, column) => sum + (column.cards?.length || 0), 0),
      analyzedCards,
    }
  }
}
