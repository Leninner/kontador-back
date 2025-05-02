import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class WhatsappRepository {
  abstract sendMessage(params: { to: string; message: string }): Promise<void>
}
