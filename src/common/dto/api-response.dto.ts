export class ApiErrorDto {
  readonly message: string
  readonly code: string

  constructor(params: { message: string; code: string }) {
    this.message = params.message
    this.code = params.code
  }
}

export class ApiResponseDto<T = any> {
  readonly success: boolean
  readonly data?: T
  readonly error?: ApiErrorDto

  constructor(params: { success: boolean; data?: T; error?: ApiErrorDto }) {
    this.success = params.success
    this.data = params.data
    this.error = params.error
  }
}
