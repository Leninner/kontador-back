import { Injectable } from '@nestjs/common'
import { BoardsService } from '../boards.service'
import { CreateCardDto } from '../dto/create-card.dto'
import { User } from '../../auth/entities/user.entity'
import { Card, CardPriority } from '../entities/card.entity'

export interface CreateTaskFromWhatsAppInput {
  name: string
  createdBy: User
  description?: string
  dueDate?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  customerId?: string
}

@Injectable()
export class WhatsappTaskService {
  constructor(private readonly boardsService: BoardsService) {}

  async createTask(input: CreateTaskFromWhatsAppInput): Promise<Card> {
    const { name, description, dueDate, priority, createdBy, customerId } = input

    const createCardDto: CreateCardDto = {
      name,
      description,
      customerId,
      columnId: createdBy.board.columns.find((column) => column.order === 0)?.id || '',
      priority: (priority as CardPriority) || CardPriority.MEDIUM,
    }

    if (dueDate) {
      createCardDto.dueDate = new Date(dueDate)
    }

    return await this.boardsService.createCard(createCardDto, createdBy)
  }
}
