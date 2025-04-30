import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
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
   * Runs every day at 8AM UTC-5 (13:00 UTC)
   */
  @Cron('0 13 * * *')
  async checkDueDateApproaching() {
    this.logger.log('Checking for cards with approaching due dates')

    const today = new Date()
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
        tomorrow,
        fiveDaysLater,
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
      return
    }

    const processingPromises = cards.map((card) => this.columnRulesService.processDueDateApproaching(card))
    await Promise.all(processingPromises)
  }

  @Cron('0 14 * * *')
  async notifyUpcomingDueDateToAccountant() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const cards = await this.cardsRepository
      .createQueryBuilder('card')
      .innerJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('card.customer', 'customer')
      .leftJoinAndSelect('customer.accountant', 'accountant')
      .where('card.dueDate BETWEEN :startOfDay AND :endOfDay', {
        startOfDay: today,
        endOfDay: endOfDay,
      })
      .andWhere('customer.accountant IS NOT NULL')
      .getMany()

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
      return
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
  }
}
