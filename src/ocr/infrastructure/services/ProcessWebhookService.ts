import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { ProcessIncomingMessage } from '../../../whatsapp/application/usecases/ProcessIncomingMessage'
import { IWhatsappWebhook } from '../../../whatsapp/domain/interfaces/IWhatsappWebhook'
import { ApiResponseDto } from '../../../common/dto/api-response.dto'

@Injectable()
export class ProcessWebhookService {
  constructor(
    @Inject(forwardRef(() => ProcessIncomingMessage))
    private readonly processIncomingMessage: ProcessIncomingMessage,
  ) {}

  async process(body: IWhatsappWebhook) {
    try {
      // If it's a media message, use the original image processing flow
      console.log('Processing message', body)
      await this.processIncomingMessage.run({
        from: body.From,
        to: body.To,
        message: body.Body,
        mediaUrl: body.MediaUrl0,
      })

      return new ApiResponseDto({
        success: true,
        data: 'Message received',
      })
    } catch (error) {
      console.error('Error processing webhook', error)

      return new ApiResponseDto({
        success: false,
        error: {
          message: 'Error processing message',
          code: 'ERROR_PROCESSING_MESSAGE',
        },
      })
    }
  }
}
