import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Card } from '../entities/card.entity'
import { ColumnRulesService } from './column-rules.service'
import { TriggerType } from '../dto/column-rule-types'
import { MailService } from './mail.service'

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name)

  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    private columnRulesService: ColumnRulesService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Check for cards with approaching due dates
   * @param targetDate The reference date to check from (defaults to today)
   */
  async checkDueDateApproaching(targetDate?: Date) {
    this.logger.log('Checking for cards with approaching due dates')

    const today = targetDate || new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const fiveDaysLater = new Date(today)
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5)

    // Find cards with due dates between tomorrow and 5 days from now
    const cards = await this.cardsRepository
      .createQueryBuilder('card')
      .innerJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('card.customer', 'customer')
      .where('card.dueDate BETWEEN :tomorrow AND :fiveDaysLater', {
        tomorrow: tomorrow.toISOString(),
        fiveDaysLater: fiveDaysLater.toISOString(),
      })
      .andWhere('column.rules IS NOT NULL')
      .andWhere("column.rules->>'enabled' = :enabled", { enabled: 'true' })
      .andWhere(
        "EXISTS (SELECT 1 FROM jsonb_array_elements(column.rules->'rules') as rule WHERE rule->'trigger'->>'type' = :triggerType)",
      )
      .setParameter('triggerType', TriggerType.DUE_DATE_APPROACHING)
      .getMany()

    this.logger.log(`Found ${cards.length} cards with approaching due dates`)
    if (cards.length === 0) {
      this.logger.log('No cards with approaching due dates found')
      return {
        status: 'success',
        message: 'No cards with approaching due dates found',
        count: 0,
      }
    }

    const processingPromises = cards.map((card) => this.columnRulesService.processDueDateApproaching(card))
    await Promise.all(processingPromises)

    return {
      status: 'success',
      message: `Processed ${cards.length} cards with approaching due dates`,
      count: cards.length,
    }
  }

  async notifyUpcomingDueDateToAccountant(targetDate?: Date) {
    const today = targetDate || new Date()
    today.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const cards = await this.cardsRepository
      .createQueryBuilder('card')
      .innerJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('card.customer', 'customer')
      .leftJoinAndSelect('customer.accountant', 'accountant')
      .where('DATE(card.dueDate) = DATE(:today)', { today: endOfDay.toISOString().split('T')[0] })
      .andWhere('customer.accountant IS NOT NULL')
      .getMany()

    if (cards.length === 0) {
      const queryParams = {
        startOfDay: today.toISOString(),
        endOfDay: endOfDay.toISOString(),
      }
      this.logger.log(`Query parameters: ${JSON.stringify(queryParams)}`)

      // Check if there are any cards with due dates at all
      const totalCards = await this.cardsRepository.count()
      this.logger.log(`Total cards in database: ${totalCards}`)
    }

    // Agrupar tarjetas por contador
    const cardsByAccountant = cards.reduce((acc, card) => {
      const accountantId = card.customer?.accountant?.id
      if (accountantId) {
        if (!acc[accountantId]) {
          acc[accountantId] = {
            accountant: card.customer.accountant,
            cards: [],
          }
        }
        acc[accountantId].cards.push(card)
      }
      return acc
    }, {})

    this.logger.log(`Found ${cards.length} cards with upcoming due dates`)
    if (cards.length === 0) {
      this.logger.log('No cards with upcoming due dates found')
      return {
        status: 'success',
        message: 'No cards with upcoming due dates found',
        count: 0,
      }
    }

    const promises = Object.values(cardsByAccountant).map(({ accountant, cards }) =>
      this.mailService.sendTypedTemplateEmail(
        accountant.email as string,
        'Tarjetas con fecha de vencimiento próxima',
        'custom-message',
        {
          customMessage: `
            <p>Hola ${accountant.name},</p>
            <p>Tenemos las siguientes tarjetas con fecha de vencimiento próxima:</p>
            <ul>
              ${cards.map((card: Card) => `<li>Tarjeta: ${card.name}</li>`).join('')}
            </ul>
            <p>Por favor, revise los detalles en su cuenta de Kontador.</p>
            <p>Si tiene alguna pregunta, no dude en contactar a su contador asignado.</p>
          `,
        },
      ),
    )

    await Promise.all(promises)

    return {
      status: 'success',
      message: `Notified accountants about ${cards.length} cards with upcoming due dates`,
      count: cards.length,
      accountantCount: Object.keys(cardsByAccountant).length,
    }
  }
}
