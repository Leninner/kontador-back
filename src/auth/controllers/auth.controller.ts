import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { ILoginDto, IRegisterDto, IAuthResponse } from '../../common/interfaces/auth.interface'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: IRegisterDto): Promise<IAuthResponse> {
    return this.authService.register(dto)
  }

  @Post('login')
  async login(@Body() dto: ILoginDto): Promise<IAuthResponse> {
    return this.authService.login(dto)
  }
}
