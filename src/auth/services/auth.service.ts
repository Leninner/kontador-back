import { Injectable, UnauthorizedException, Inject, forwardRef, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { ILoginDto, IRegisterDto, IAuthResponse, IVerifyDto } from '../../common/interfaces/auth.interface'
import * as bcrypt from 'bcrypt'
import { ApiResponseDto } from '../../common/dto/api-response.dto'
import { BoardsService } from '../../boards/boards.service'
import * as Sentry from '@sentry/node'
import { TwilioWhatsappRepository } from '../../whatsapp/infrastructure/TwilioWhatsappRepository'
import { UpdateUserDto } from '../dto/update-user.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => BoardsService))
    private readonly boardsService: BoardsService,
    private readonly whatsappRepository: TwilioWhatsappRepository,
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
      Sentry.setTags({
        user_id: user.id,
        email: user.email,
        name: user.name,
      })

      Sentry.captureException(error)
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
          phoneVerified: user.phoneVerified,
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
          phoneVerified: user.phoneVerified,
          phone: user.phone,
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

  async verify(dto: IVerifyDto, user: User): Promise<IAuthResponse> {
    const formattedPhone = `${dto.countryCode}${dto.phoneNumber}`

    const existingUserWithPhone = await this.userRepository.findOne({
      where: { phone: formattedPhone },
    })

    if (existingUserWithPhone) {
      throw new ConflictException({
        success: false,
        error: {
          message: 'Este número de teléfono ya está asociado a otra cuenta',
          code: 'PHONE_ALREADY_IN_USE',
        },
      })
    }

    user.phone = formattedPhone

    try {
      // Welcome message with OCR and AI task creation instructions
      const welcomeMessage = `✅ *¡Tu número de WhatsApp ha sido verificado exitosamente en Kontador!*

          🔍 *Funcionalidad de OCR:*
          Simplemente envía una imagen de tu factura y nuestro sistema extraerá automáticamente toda la información relevante.
          📸 → 📄 → ✓

          🤖 *Creación de tareas con IA:*
          Para crear una nueva tarea, envía un mensaje con:
          • 📝 Contexto de la tarea
          • 🆔 Cédula o RUC del cliente
          • ⭐ Prioridad: 
            🟢 Baja
            🟡 Media
            🔴 Alta
          • 🏷️ Etiquetas: sepáralas con hashtags (#impuestos #mensual #declaración)
          • 📋 Lo que necesitas realizar

          _Ejemplo: "Necesito preparar declaración mensual del IVA para cliente 1234567890, prioridad alta, #impuestos #mensual para la próxima semana."_
                `

      await this.whatsappRepository.sendMessage({
        to: formattedPhone,
        message: welcomeMessage,
      })

      user.phoneVerified = true
      await this.userRepository.save(user)

      const token = this.generateToken(user)

      return new ApiResponseDto({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phoneVerified: user.phoneVerified,
          },
          token,
        },
      })
    } catch (error) {
      Sentry.setTags({
        user_id: user.id,
        email: user.email,
        phone: formattedPhone,
      })

      Sentry.captureException(error)

      throw new ConflictException({
        success: false,
        error: {
          message: 'Error al verificar el número de WhatsApp',
          code: 'VERIFICATION_FAILED',
        },
      })
    }
  }

  async updateUser(dto: UpdateUserDto, user: User): Promise<IAuthResponse> {
    try {
      if (dto.email && dto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: dto.email },
        })

        if (existingUser) {
          throw new ConflictException({
            success: false,
            error: {
              message: 'El email ya está en uso',
              code: 'EMAIL_EXISTS',
            },
          })
        }
      }

      // Update user properties
      Object.assign(user, {
        ...dto,
      })

      // Save updated user
      await this.userRepository.save(user)

      // Generate new token with updated information
      const token = this.generateToken(user)

      return new ApiResponseDto({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            phoneVerified: user.phoneVerified,
            licenseNumber: user.licenseNumber,
            taxIdentificationNumber: user.taxIdentificationNumber,
            specialization: user.specialization,
            languages: user.languages,
          },
          token,
        },
      })
    } catch (error) {
      Sentry.setTags({
        user_id: user.id,
        email: user.email,
      })

      Sentry.captureException(error)

      if (error instanceof ConflictException) {
        throw error
      }

      throw new UnauthorizedException({
        success: false,
        error: {
          message: 'Error al actualizar el perfil',
          code: 'UPDATE_FAILED',
        },
      })
    }
  }
}
