import { Controller, Post, Query, ParseDatePipe } from '@nestjs/common'
import { ScheduledTasksService } from '../services/scheduled-tasks.service'

@Controller('scheduled-tasks')
export class ScheduledTasksController {
  constructor(private readonly scheduledTasksService: ScheduledTasksService) {}

  @Post('check-due-date-approaching')
  async checkDueDateApproaching(@Query('date', new ParseDatePipe({ optional: true })) date?: Date) {
    return this.scheduledTasksService.checkDueDateApproaching(date)
  }

  @Post('notify-upcoming-due-date')
  async notifyUpcomingDueDateToAccountant(@Query('date', new ParseDatePipe({ optional: true })) date?: Date) {
    return this.scheduledTasksService.notifyUpcomingDueDateToAccountant(date)
  }
}
