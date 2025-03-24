import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { ILoginDto, IRegisterDto } from '../../common/interfaces/auth.interface'

export class LoginDto implements ILoginDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(32, { message: 'Password must not exceed 32 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string
}

export class RegisterDto extends LoginDto implements IRegisterDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string
}
