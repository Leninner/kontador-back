export interface IUser {
  id: string
  email: string
  name: string
  password: string
  createdAt: Date
  updatedAt: Date
  phone?: string
  phoneVerified: boolean
  licenseNumber?: string
  taxIdentificationNumber?: string
  specialization?: string
  languages?: string
}

export interface IAuthResponse {
  success: boolean
  data?: {
    user: Omit<IUser, 'password' | 'createdAt' | 'updatedAt'>
    token: string
  }
  error?: {
    message: string
    code: string
  }
}

export interface ILoginDto {
  email: string
  password: string
}

export interface IRegisterDto {
  name: string
  email: string
  password: string
}

export interface IVerifyDto {
  countryCode: string
  phoneNumber: string
}

export interface IUpdateUserDto {
  name?: string
  email?: string
  phone?: string
  licenseNumber?: string
  taxIdentificationNumber?: string
  specialization?: string
  languages?: string
}

export interface IJwtPayload {
  sub: string
  email: string
  name: string
}
