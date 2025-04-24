import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Card } from '../entities/card.entity'
import { ColumnRulesService } from './column-rules.service'
import { TriggerType } from '../dto/column-rule-types'

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name)

  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
    private columnRulesService: ColumnRulesService,
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
}
