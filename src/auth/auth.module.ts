import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { User } from './entities/user.entity'
import { Customer } from '../customers/entities/customer.entity'
import { BoardsModule } from '../boards/boards.module'
import { WhatsappModule } from '../whatsapp/whatsapp.module'
import { UserService } from './services/user.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, Customer]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('NODE_ENV') === 'development' ? '7d' : '1d' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => BoardsModule),
    WhatsappModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ConfigService, UserService],
  exports: [AuthService],
})
export class AuthModule {}
