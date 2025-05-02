import { TransformImage } from '../../../ocr/application/services/TransformImage'
import { IOcrResult } from '../../../ocr/domain/interfaces/IOcrResult'
import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { OpenAiOcrRepository } from '../../../ocr/infrastructure/openai/OpenAiOcrRepository'
import { OpenAiMessageRepository } from '../../infrastructure/OpenAiMessageRepository'

@Injectable()
export class ProcessImageMessage {
  constructor(
    @Inject(forwardRef(() => OpenAiOcrRepository))
    private readonly ocrRepository: OpenAiOcrRepository,

    @Inject(forwardRef(() => TransformImage))
    private readonly transformImageService: TransformImage,

    @Inject(forwardRef(() => OpenAiMessageRepository))
    private readonly taskProcessRepository: OpenAiMessageRepository,
  ) {}

  async run(params: { imageUrl?: string; message: string }) {
    const { imageUrl, message } = params

    if (imageUrl) {
      const base64Image = await this.transformImageService.transformImage(imageUrl)
      const text = await this.ocrRepository.extractTextFromImage(base64Image)
      return JSON.parse(text) as IOcrResult
    }

    const text = await this.taskProcessRepository.extractTaskFromMessage(message)

    return text
  }
}
