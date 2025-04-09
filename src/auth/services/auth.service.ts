import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { ILoginDto, IRegisterDto, IAuthResponse } from '../../common/interfaces/auth.interface'
import * as bcrypt from 'bcrypt'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { BoardsService } from '../../boards/boards.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => BoardsService))
    private readonly boardsService: BoardsService,
  ) {}

  async register(dto: IRegisterDto): Promise<IAuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'El email ya está en uso',
          code: 'EMAIL_EXISTS',
        },
      })
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    })

    await this.userRepository.save(user)

    try {
      await this.boardsService.createBoard(
        {
          name: `Tablero de ${user.name}`,
          description: 'Tablero creado automáticamente',
        },
        user,
      )
    } catch (error) {
      console.error('Error al crear el tablero automático:', error)
    }

    const token = this.generateToken(user)

    return new ApiResponseDto({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    })
  }

  async login(dto: ILoginDto): Promise<IAuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS',
        },
      })
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS',
        },
      })
    }

    const token = this.generateToken(user)

    return new ApiResponseDto({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    })
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    })
  }
}
