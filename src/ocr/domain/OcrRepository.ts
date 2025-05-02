import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class OcrRepository {
  abstract extractTextFromImage(imageUrl: string): Promise<string>
}
