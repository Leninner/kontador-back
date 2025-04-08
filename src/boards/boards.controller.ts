import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common'
import { BoardsService } from './boards.service'
import { CreateBoardDto } from './dto/create-board.dto'
import { CreateColumnDto } from './dto/create-column.dto'
import { CreateCardDto } from './dto/create-card.dto'
import { CreateCommentDto } from './dto/create-comment.dto'
import { UpdateCardDto } from './dto/update-card.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../auth/entities/user.entity'
import { ApiResponseDto } from '../common/dto/api-response.dto'

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  async createBoard(@Body() createBoardDto: CreateBoardDto, @CurrentUser() user: User) {
    const board = await this.boardsService.createBoard(createBoardDto, user)

    return new ApiResponseDto({
      success: true,
      data: board,
    })
  }

  @Get()
  async getUserBoard(@CurrentUser() user: User) {
    const board = await this.boardsService.getUserBoard(user)

    return new ApiResponseDto({
      success: true,
      data: board,
    })
  }

  @Post('columns')
  async createColumn(@Body() createColumnDto: CreateColumnDto, @CurrentUser() user: User) {
    const column = await this.boardsService.createColumn(createColumnDto, user)

    return new ApiResponseDto({
      success: true,
      data: column,
    })
  }

  @Get('columns/:id')
  async getColumn(@Param('id') id: string, @CurrentUser() user: User) {
    const column = await this.boardsService.getColumn(id, user)

    return new ApiResponseDto({
      success: true,
      data: column,
    })
  }

  @Post('cards')
  async createCard(@Body() createCardDto: CreateCardDto, @CurrentUser() user: User) {
    const card = await this.boardsService.createCard(createCardDto, user)

    return new ApiResponseDto({
      success: true,
      data: card,
    })
  }

  @Get('cards/:id')
  async getCard(@Param('id') id: string, @CurrentUser() user: User) {
    const card = await this.boardsService.getCard(id, user)

    return new ApiResponseDto({
      success: true,
      data: card,
    })
  }

  @Patch('cards/:id')
  async updateCard(@Param('id') id: string, @Body() updateCardDto: UpdateCardDto, @CurrentUser() user: User) {
    console.log('updateCardDto', updateCardDto, 'id', id, 'user', user)
    const card = await this.boardsService.updateCard(id, updateCardDto, user)

    return new ApiResponseDto({
      success: true,
      data: card,
    })
  }

  @Post('comments')
  async createComment(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: User) {
    const comment = await this.boardsService.createComment(createCommentDto, user)

    return new ApiResponseDto({
      success: true,
      data: comment,
    })
  }
}
