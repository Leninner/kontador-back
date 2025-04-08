import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
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
import { CreateCardDto } from './dto/create-card.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
import { UpdateCardDto } from './dto/update-card.dto'
import { HistoryActionType } from './entities/card-history.entity'
import { CustomersService } from '../customers/customers.service'
import { Customer } from '../customers/entities/customer.entity'

@Injectable()
export class BoardsService {
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
    private customersService: CustomersService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto, user: User): Promise<Board> {
    // Check if user already has a board - optimized query with select
    const existingBoard = await this.boardRepository
      .createQueryBuilder('board')
      .select('board.id')
      .where('board.user = :userId', { userId: user.id })
      .getOne()

    if (existingBoard) {
      throw new BadRequestException('User already has a board')
    }

    const board = this.boardRepository.create({
      ...createBoardDto,
      user,
    })

    return this.boardRepository.save(board)
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
      board: { id: board.id } as Board,
    })

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

      const oldColumnId = card.column.id
      const oldColumnName = card.column.name
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
