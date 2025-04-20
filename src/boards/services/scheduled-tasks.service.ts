import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { Card } from '../entities/card.entity'
import { ColumnRulesService } from './column-rules.service'

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
    const cards = await this.cardsRepository.find({
      where: {
        dueDate: Between(tomorrow, fiveDaysLater),
        column: {
          rules: {
            enabled: true,
            rules: {
              trigger: {
                type: 'due_date_approaching',
              },
            },
          },
        },
      },
      relations: ['column', 'customer'],
    })

    this.logger.log(`Found ${cards.length} cards with approaching due dates`)

    for (const card of cards) {
      this.columnRulesService.processDueDateApproaching(card)
    }
  }
}
