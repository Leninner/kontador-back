import axios from 'axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TransformImage {
  async transformImage(imageUrl: string): Promise<string> {
    const response = await axios.get(imageUrl, {
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID!,
        password: process.env.TWILIO_AUTH_TOKEN!,
      },
      responseType: 'arraybuffer',
    })

    const base64Image = Buffer.from(response.data, 'binary').toString('base64')

    return base64Image
  }
}
