import { Controller, Post, Body, UseGuards, Put, Get } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { IAuthResponse } from '../../common/interfaces/auth.interface'
import { LoginDto, RegisterDto, VerifyDto } from '../dto/auth.dto'
import { CurrentUser } from '../decorators/current-user.decorator'
import { User } from '../entities/user.entity'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { UpdateUserDto } from '../dto/update-user.dto'
import { UserService } from '../services/user.service'
import { ApiResponseDto } from '../../common/dto/api-response.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<IAuthResponse> {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<IAuthResponse> {
    return this.authService.login(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Body() dto: VerifyDto, @CurrentUser() user: User): Promise<IAuthResponse> {
    return this.authService.verify(dto, user)
  }

  @UseGuards(JwtAuthGuard)
  @Put('user')
  async updateUser(@Body() dto: UpdateUserDto, @CurrentUser() user: User): Promise<IAuthResponse> {
    return this.authService.updateUser(dto, user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUser(@CurrentUser() user: User): Promise<ApiResponseDto<{ user: User | null }>> {
    return this.userService.getUser(user)
  }
}
