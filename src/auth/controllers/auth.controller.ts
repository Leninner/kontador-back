import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { IAuthResponse } from '../../common/interfaces/auth.interface'
import { LoginDto, RegisterDto, VerifyDto } from '../dto/auth.dto'
import { CurrentUser } from '../decorators/current-user.decorator'
import { User } from '../entities/user.entity'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
