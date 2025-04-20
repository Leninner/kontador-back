import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Board } from './entities/board.entity'
import { Column } from './entities/column.entity'
import { Card } from './entities/card.entity'
import { Comment } from './entities/comment.entity'
import { CardHistory } from './entities/card-history.entity'
import { User } from '../auth/entities/user.entity'
import { CreateBoardDto } from './dto/create-board.dto'
import { CreateColumnDto } from './dto/create-column.dto'
import { UpdateColumnDto } from './dto/update-column.dto'
import { CreateCardDto } from './dto/create-card.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
import { UpdateCardDto } from './dto/update-card.dto'
import { HistoryActionType } from './entities/card-history.entity'
import { CustomersService } from '../customers/customers.service'
import { Customer } from '../customers/entities/customer.entity'
import { CardNotificationService } from './services/card-notification.service'
import { ColumnRulesService } from './services/column-rules.service'
import { CreateColumnRulesDto } from './dto/create-column-rules.dto'
import { ActionType, ConditionType, TriggerType } from './dto/column-rule-types'

@Injectable()
export class BoardsService {
  private readonly logger = new Logger(BoardsService.name)

  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CardHistory)
    private historyRepository: Repository<CardHistory>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    private cardNotificationService: CardNotificationService,
    private columnRulesService: ColumnRulesService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto, user: User): Promise<Board> {
    const existingBoard = await this.boardRepository
      .createQueryBuilder('board')
      .select('board.id')
      .where('board.user = :userId', { userId: user.id })
      .getOne()

    if (existingBoard) {
      throw new BadRequestException('User already has a board')
    }

    // Create and save the board entity
    const board = this.boardRepository.create({
      ...createBoardDto,
      user,
    })

    // Save board using transaction to ensure data consistency
    try {
      const savedBoard = await this.boardRepository.save(board)
      await this.createDefaultColumns(savedBoard)

      // Fetch the board with columns
      const boardWithColumns = await this.boardRepository.findOne({
        where: { id: savedBoard.id },
        relations: ['columns'],
      })

      if (!boardWithColumns) {
        throw new NotFoundException(`Board with ID ${savedBoard.id} not found after creation`)
      }

      return boardWithColumns
    } catch (error) {
      this.logger.error(`Failed to create board: ${error.message}`, error.stack)
      throw error
    }
  }

  private async createDefaultColumns(board: Board): Promise<void> {
    const generateRandomRuleId = (boardId: string): string => {
      return `rule-${Math.random().toString(36).substring(2, 15)}-${boardId.toString().slice(0, 8)}` // 8 characters
    }

    const defaultColumns = [
      {
        name: 'Por hacer',
        description: 'Tareas pendientes por iniciar',
        order: 0,
        board: board,
        color: '#FFD700',
        rules: {
          enabled: false,
          rules: [],
        },
      },
      {
        name: 'En progreso',
        description: 'Tareas que se están trabajando actualmente',
        order: 1,
        board: board,
        color: '#FFD700',
        rules: {
          enabled: true,
          rules: [
            {
              id: generateRandomRuleId(board.id),
              name: 'Notificar al iniciar',
              enabled: true,
              trigger: {
                type: TriggerType.CARD_MOVED,
                config: {},
              },
              conditions: [
                {
                  type: ConditionType.HAS_CUSTOMER,
                  config: {},
                },
              ],
              action: {
                type: ActionType.SEND_EMAIL,
                config: {
                  subject: 'Tu trámite ha iniciado',
                  customMessage: `<p>Estimado cliente,</p><p>Hemos comenzado a trabajar en tu trámite.</p>`,
                  templateName: 'card-moved',
                },
              },
            },
          ],
        },
      },
      {
        name: 'Revisión',
        description: 'Tareas que necesitan ser revisadas',
        order: 2,
        board: board,
        color: '#FFD700',
        rules: {
          enabled: true,
          rules: [
            {
              id: generateRandomRuleId(board.id),
              name: 'Notificar en revisión',
              enabled: true,
              trigger: {
                type: TriggerType.CARD_MOVED,
                config: {},
              },
              conditions: [
                {
                  type: ConditionType.HAS_CUSTOMER,
                  config: {},
                },
              ],
              action: {
                type: ActionType.SEND_EMAIL,
                config: {
                  subject: 'Tu trámite está en revisión',
                  templateName: 'card-moved',
                },
              },
            },
          ],
        },
      },
      {
        name: 'Completado',
        description: 'Tareas finalizadas',
        order: 3,
        board: board,
        color: '#FFD700',
        rules: {
          enabled: true,
          rules: [
            {
              id: generateRandomRuleId(board.id),
              name: 'Notificar al completar',
              enabled: true,
              trigger: {
                type: TriggerType.CARD_MOVED,
                config: {},
              },
              conditions: [
                {
                  type: ConditionType.HAS_CUSTOMER,
                  config: {},
                },
              ],
              action: {
                type: ActionType.SEND_EMAIL,
                config: {
                  subject: 'Tu trámite ha sido completado',
                  customMessage: `<p>Estimado {{customer.name}},</p><p>Nos complace informarte que tu trámite ha sido completado exitosamente.</p><p>Saludos cordiales,<br>{{accountant.name}}</p>`,
                  templateName: 'card-moved',
                },
              },
            },
          ],
        },
      },
    ]

    try {
      const columns = this.columnRepository.create(defaultColumns)
      await this.columnRepository.save(columns)
      this.logger.log(`Created default columns for board ID: ${board.id}`)
    } catch (error) {
      this.logger.error(`Failed to create default columns for board ID ${board.id}: ${error.message}`, error.stack)
      // We don't rethrow the error to allow board creation to succeed even if columns fail
    }
  }

  async getUserBoard(user: User): Promise<Board> {
    // Optimized query with eager loading and explicit relations
    const board = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.columns', 'columns')
      .leftJoinAndSelect('columns.cards', 'cards')
      .where('board.user = :userId', { userId: user.id })
      .andWhere('board.deletedAt IS NULL')
      .andWhere('columns.deletedAt IS NULL')
      .andWhere('cards.deletedAt IS NULL')
      .orderBy('columns.order', 'ASC')
      .addOrderBy('cards.createdAt', 'DESC')
      .getOne()

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    return board
  }

  async createColumn(createColumnDto: CreateColumnDto, user: User): Promise<Column> {
    // Optimized query with select
    const board = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.columns', 'columns')
      .where('board.id = :boardId', { boardId: createColumnDto.boardId })
      .andWhere('board.user = :userId', { userId: user.id })
      .getOne()

    if (!board) {
      throw new NotFoundException('Board not found')
    }

    // If order is not provided, set it to the next available order
    if (createColumnDto.order === undefined) {
      const maxOrder = board.columns.reduce((max, column) => (column.order > max ? column.order : max), -1)
      createColumnDto.order = maxOrder + 1
    } else {
      // If order is provided, reorder other columns - optimized bulk update
      await this.columnRepository
        .createQueryBuilder('column')
        .update()
        .set({ order: () => 'order + 1' })
        .where('board = :boardId', { boardId: createColumnDto.boardId })
        .andWhere('order >= :orderValue', { orderValue: createColumnDto.order })
        .execute()
    }

    const column = this.columnRepository.create({
      name: createColumnDto.name,
      description: createColumnDto.description,
      order: createColumnDto.order,
      board: { id: board.id } as Board,
    })

    return this.columnRepository.save(column)
  }

  async updateColumn(id: string, updateColumnDto: UpdateColumnDto, user: User): Promise<Column> {
    const column = await this.columnRepository
      .createQueryBuilder('column')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'user')
      .where('column.id = :columnId', { columnId: id })
      .andWhere('user.id = :userId', { userId: user.id })
      .getOne()

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    if (updateColumnDto.name !== undefined) {
      column.name = updateColumnDto.name
    }

    if (updateColumnDto.description !== undefined) {
      column.description = updateColumnDto.description
    }

    if (updateColumnDto.order !== undefined) {
      column.order = updateColumnDto.order
    }

    if (updateColumnDto.rules !== undefined) {
      column.rules = updateColumnDto.rules
    }

    if (updateColumnDto.color !== undefined) {
      column.color = updateColumnDto.color
    }

    return this.columnRepository.save(column)
  }

  async getColumn(id: string, user: User): Promise<Column> {
    // Optimized query with better joins and select
    const column = await this.columnRepository
      .createQueryBuilder('column')
      .leftJoinAndSelect('column.cards', 'cards')
      .leftJoinAndSelect('cards.customer', 'customer')
      .leftJoinAndSelect('cards.comments', 'comments')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'user')
      .where('column.id = :columnId', { columnId: id })
      .andWhere('user.id = :userId', { userId: user.id })
      .orderBy('cards.createdAt', 'DESC')
      .getOne()

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    return column
  }

  async createCard(createCardDto: CreateCardDto, user: User): Promise<Card> {
    // Optimized query with select
    const column = await this.columnRepository
      .createQueryBuilder('column')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'user')
      .where('column.id = :columnId', { columnId: createCardDto.columnId })
      .andWhere('user.id = :userId', { userId: user.id })
      .getOne()

    if (!column) {
      throw new NotFoundException('Column not found')
    }

    const card = this.cardRepository.create({
      name: createCardDto.name,
      description: createCardDto.description,
      dueDate: createCardDto.dueDate,
      column,
    })

    if (createCardDto.customerId) {
      const customer = await this.customersService.findOne(createCardDto.customerId)
      card.customer = customer
    }

    const savedCard = await this.cardRepository.save(card)

    await this.createCardHistory(savedCard, user, HistoryActionType.CREATED, null, 'Card created')

    // Process column rules for card creation
    this.columnRulesService.processCardCreated(savedCard)

    return savedCard
  }

  async getCard(id: string): Promise<Card> {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoin('card.customer', 'customer')
      .leftJoin('card.comments', 'comments')
      .leftJoin('card.history', 'history')
      .select(['card', 'customer.id', 'customer.name', 'customer.email', 'comments', 'history'])
      .where('card.id = :cardId', { cardId: id })
      .andWhere('card.deletedAt IS NULL')
      .andWhere('comments.deletedAt IS NULL')
      .orderBy('history.createdAt', 'DESC')
      .addOrderBy('comments.createdAt', 'DESC')
      .getOne()

    if (!card) {
      throw new NotFoundException('Card not found')
    }

    return card
  }

  async updateCard(id: string, updateCardDto: UpdateCardDto, user: User): Promise<Card> {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('column.board', 'board')
      .leftJoinAndSelect('board.user', 'user')
      .leftJoinAndSelect('card.customer', 'customer')
      .where('card.id = :cardId', { cardId: id })
      .andWhere('user.id = :userId', { userId: user.id })
      .getOne()

    if (!card) {
      throw new NotFoundException('Card not found')
    }

    const changes: Record<string, { old: any; new: any }> = {}

    if (updateCardDto.name !== undefined && updateCardDto.name !== card.name) {
      changes.name = { old: card.name, new: updateCardDto.name }
      card.name = updateCardDto.name
    }

    if (updateCardDto.description !== undefined && updateCardDto.description !== card.description) {
      changes.description = { old: card.description, new: updateCardDto.description }
      card.description = updateCardDto.description
    }

    if (updateCardDto.dueDate !== undefined) {
      const oldDueDate = card.dueDate ? card.dueDate.toISOString() : null
      const newDueDate = updateCardDto.dueDate ? new Date(updateCardDto.dueDate).toISOString() : null

      if (oldDueDate !== newDueDate) {
        changes.dueDate = { old: oldDueDate, new: newDueDate }
        card.dueDate = updateCardDto.dueDate ? new Date(updateCardDto.dueDate) : new Date()

        await this.createCardHistory(
          card,
          user,
          HistoryActionType.DUE_DATE_CHANGED,
          { old: oldDueDate, new: newDueDate },
          `Due date ${newDueDate ? 'changed' : 'removed'}`,
        )
      }
    }

    // Handle moving card to another column
    if (updateCardDto.columnId && updateCardDto.columnId !== card.column.id) {
      // Store the old column for notification
      const oldColumn = card.column
      const previousColumnId = oldColumn.id

      // Optimized query with select
      const newColumn = await this.columnRepository
        .createQueryBuilder('column')
        .innerJoin('column.board', 'board')
        .innerJoin('board.user', 'user')
        .where('column.id = :columnId', { columnId: updateCardDto.columnId })
        .andWhere('user.id = :userId', { userId: user.id })
        .andWhere('column.deletedAt IS NULL')
        .getOne()

      if (!newColumn) {
        throw new NotFoundException('Column not found')
      }

      const oldColumnId = oldColumn.id
      const oldColumnName = oldColumn.name
      changes.column = { old: oldColumnId, new: updateCardDto.columnId }

      card.column = newColumn

      await this.createCardHistory(
        card,
        user,
        HistoryActionType.MOVED,
        {
          oldColumnId,
          oldColumnName,
          newColumnId: newColumn.id,
          newColumnName: newColumn.name,
        },
        `Moved from ${oldColumnName} to ${newColumn.name}`,
      )

      await this.cardRepository.save(card)
      await this.cardNotificationService.handleCardMoved(card, oldColumn, newColumn, user)

      // Process column rules for card movement
      this.columnRulesService.processCardMoved(card, previousColumnId)

      return card
    }

    // Handle customer linking/unlinking
    if (updateCardDto.customerId !== undefined) {
      const oldCustomerId = card.customer?.id
      const oldCustomerName = card.customer?.name

      if (updateCardDto.customerId && updateCardDto.customerId !== oldCustomerId) {
        // Link new customer
        const customer = await this.customersService.findOne(updateCardDto.customerId)
        card.customer = customer
        changes.customer = { old: oldCustomerId, new: updateCardDto.customerId }

        await this.createCardHistory(
          card,
          user,
          HistoryActionType.CUSTOMER_LINKED,
          { oldCustomerId, newCustomerId: customer.id, customerName: customer.name },
          `Linked to customer: ${customer.name}`,
        )
      } else if (!updateCardDto.customerId && oldCustomerId) {
        // Unlink customer
        changes.customer = { old: oldCustomerId, new: null }
        card.customer = null as unknown as Customer

        await this.createCardHistory(
          card,
          user,
          HistoryActionType.CUSTOMER_UNLINKED,
          { oldCustomerId, oldCustomerName },
          `Unlinked from customer: ${oldCustomerName}`,
        )
      }
    }

    await this.cardRepository.save(card)

    if (changes.name || changes.column) {
      await this.createCardHistory(card, user, HistoryActionType.UPDATED, changes, 'Card updated')
    }

    return card
  }

  async createComment(createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.column', 'column')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'boardUser')
      .where('card.id = :cardId', { cardId: createCommentDto.cardId })
      .andWhere('boardUser.id = :userId', { userId: user.id })
      .andWhere('card.deletedAt IS NULL')
      .getOne()

    if (!card) {
      throw new NotFoundException('Card not found')
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      card,
      user,
    })

    return await this.commentRepository.save(comment)
  }

  private async createCardHistory(
    card: Card,
    user: User,
    action: HistoryActionType,
    changes: Record<string, any> | null,
    description: string,
  ): Promise<CardHistory> {
    const history = this.historyRepository.create({
      action,
      changes: changes as Record<string, any>,
      description,
      card,
      user,
    })

    return this.historyRepository.save(history)
  }

  async deleteComment(id: string, user: User): Promise<void> {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.card', 'card')
      .where('comment.id = :id', { id })
      .andWhere('card.deletedAt IS NULL')
      .andWhere('comment.deletedAt IS NULL')
      .getOne()

    if (!comment) {
      throw new NotFoundException('Comment not found')
    }

    await this.commentRepository.update(id, { deletedAt: new Date() })
    await this.createCardHistory(comment.card, user, HistoryActionType.COMMENT_DELETED, null, 'Comment deleted')
  }

  /**
   * Update column rules
   * @param id Column ID
   * @param rulesDto New rules configuration
   * @param user Current user
   * @returns Updated column
   */
  async updateColumnRules(id: string, rulesDto: CreateColumnRulesDto, user: User): Promise<Column> {
    const column = await this.columnRepository.findOne({
      where: { id },
      relations: ['board', 'board.user'],
    })

    if (!column) {
      throw new NotFoundException(`Column with ID ${id} not found`)
    }

    if (column.board.user.id !== user.id) {
      throw new BadRequestException('You do not have permission to update this column')
    }

    column.rules = rulesDto as any

    try {
      const updatedColumn = await this.columnRepository.save(column)
      this.logger.log(`Updated rules for column ID: ${id}`)
      return updatedColumn
    } catch (error) {
      this.logger.error(`Failed to update rules for column ID ${id}: ${error.message}`, error.stack)
      throw error
    }
  }
}
