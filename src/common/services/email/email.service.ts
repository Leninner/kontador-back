import { Injectable } from '@nestjs/common'
import { EmailMessage } from '../../interfaces/email.interface'
import { SendGridAdapter } from './sendgrid.adapter'

@Injectable()
export class EmailService {
  constructor(private readonly emailAdapter: SendGridAdapter) {}

  async sendEmail(message: EmailMessage): Promise<boolean> {
    return this.emailAdapter.send(message)
  }

  async sendTemplateEmail(message: EmailMessage): Promise<boolean> {
    return this.emailAdapter.sendTemplate(message)
  }
}
