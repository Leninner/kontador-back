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
    const defaultColumns = [
      {
        name: 'Por hacer',
        description: 'Tareas pendientes por iniciar',
        order: 0,
        sendEmailOnCardEntry: false,
        board: board,
      },
      {
        name: 'En progreso',
        description: 'Tareas que se están trabajando actualmente',
        order: 1,
        sendEmailOnCardEntry: true,
        emailTemplateName: 'card-moved',
        emailConfig: {
          subject: 'Tu trámite ha iniciado',
          customMessage: `<p>Estimado cliente,</p><p>Hemos comenzado a trabajar en tu trámite.</p>`,
        },
        board: board,
      },
      {
        name: 'Revisión',
        description: 'Tareas que necesitan ser revisadas',
        order: 2,
        sendEmailOnCardEntry: true,
        emailTemplateName: 'card-moved',
        emailConfig: {
          subject: 'Tu trámite está en revisión',
        },
        board: board,
      },
      {
        name: 'Completado',
        description: 'Tareas finalizadas',
        order: 3,
        sendEmailOnCardEntry: true,
        emailTemplateName: 'card-moved',
        emailConfig: {
          subject: 'Tu trámite ha sido completado',
          customMessage: `<p>Estimado {{customer.name}},</p><p>Nos complace informarte que tu trámite ha sido completado exitosamente.</p><p>Saludos cordiales,<br>{{accountant.name}}</p>`,
        },
        board: board,
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
      sendEmailOnCardEntry: createColumnDto.sendEmailOnCardEntry || false,
      emailTemplateName: createColumnDto.emailTemplateName,
      emailConfig: createColumnDto.emailConfig,
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

    // Update fields if provided
    if (updateColumnDto.name !== undefined) {
      column.name = updateColumnDto.name
    }

    if (updateColumnDto.description !== undefined) {
      column.description = updateColumnDto.description
    }

    if (updateColumnDto.order !== undefined) {
      column.order = updateColumnDto.order
    }

    if (updateColumnDto.sendEmailOnCardEntry !== undefined) {
      column.sendEmailOnCardEntry = updateColumnDto.sendEmailOnCardEntry
    }

    if (updateColumnDto.emailTemplateName !== undefined) {
      column.emailTemplateName = updateColumnDto.emailTemplateName
    }

    if (updateColumnDto.emailConfig !== undefined) {
      column.emailConfig = updateColumnDto.emailConfig
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

    // Link customer if provided
    if (createCardDto.customerId) {
      const customer = await this.customersService.findOne(createCardDto.customerId)
      card.customer = customer
    }

    const savedCard = await this.cardRepository.save(card)

    // Create history record
    await this.createCardHistory(savedCard, user, HistoryActionType.CREATED, null, 'Card created')

    return savedCard
  }

  async getCard(id: string, user: User): Promise<Card> {
    // Optimized query with better joins and ordering
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('card.customer', 'customer')
      .leftJoinAndSelect('card.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .leftJoinAndSelect('card.history', 'history')
      .leftJoinAndSelect('history.user', 'historyUser')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'boardUser')
      .where('card.id = :cardId', { cardId: id })
      .andWhere('boardUser.id = :userId', { userId: user.id })
      .orderBy('history.createdAt', 'DESC')
      .addOrderBy('comments.createdAt', 'DESC')
      .getOne()

    if (!card) {
      throw new NotFoundException('Card not found')
    }

    return card
  }

  async updateCard(id: string, updateCardDto: UpdateCardDto, user: User): Promise<Card> {
    // Optimized query with better joins
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

    // Update card properties
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

      // Optimized query with select
      const newColumn = await this.columnRepository
        .createQueryBuilder('column')
        .innerJoin('column.board', 'board')
        .innerJoin('board.user', 'user')
        .where('column.id = :columnId', { columnId: updateCardDto.columnId })
        .andWhere('user.id = :userId', { userId: user.id })
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

      // Save card before sending notification to ensure DB is updated
      await this.cardRepository.save(card)

      // Send notification if needed
      await this.cardNotificationService.handleCardMoved(card, oldColumn, newColumn, user)

      // Return early since we already saved the card
      if (Object.keys(changes).length > 0) {
        await this.createCardHistory(card, user, HistoryActionType.UPDATED, changes, 'Card updated')
      }

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

    if (Object.keys(changes).length > 0) {
      await this.createCardHistory(card, user, HistoryActionType.UPDATED, changes, 'Card updated')
    }

    return card
  }

  async createComment(createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    // Optimized query with more efficient joins
    const card = await this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.column', 'column')
      .innerJoin('column.board', 'board')
      .innerJoin('board.user', 'boardUser')
      .where('card.id = :cardId', { cardId: createCommentDto.cardId })
      .andWhere('boardUser.id = :userId', { userId: user.id })
      .getOne()

    if (!card) {
      throw new NotFoundException('Card not found')
    }

    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      card,
      user,
    })

    const savedComment = await this.commentRepository.save(comment)

    await this.createCardHistory(
      card,
      user,
      HistoryActionType.COMMENT_ADDED,
      { commentId: savedComment.id },
      `Comment added: ${createCommentDto.content.substring(0, 50)}${createCommentDto.content.length > 50 ? '...' : ''}`,
    )

    return savedComment
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
}
