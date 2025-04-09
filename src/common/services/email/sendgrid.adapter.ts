import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IEmailAdapter, EmailMessage } from '../../interfaces/email.interface'
import * as SendGrid from '@sendgrid/mail'

@Injectable()
export class SendGridAdapter implements IEmailAdapter {
  private defaultFrom: string

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY')
    if (apiKey) {
      SendGrid.setApiKey(apiKey)
    } else {
      console.warn('SENDGRID_API_KEY not found in environment variables')
    }
    this.defaultFrom = this.configService.get<string>('EMAIL_FROM', 'noreply@kontador.app')
  }

  async send(message: EmailMessage): Promise<boolean> {
    try {
      if (!this.configService.get<string>('SENDGRID_API_KEY')) {
        console.log('Email sending skipped: SENDGRID_API_KEY not configured')
        return true
      }

      await SendGrid.send({
        to: message.to,
        from: message.from || this.defaultFrom,
        subject: message.subject,
        text: message.text || '',
        html: message.html || '',
      })
      return true
    } catch (error) {
      console.error('Error sending email via SendGrid:', error)
      return false
    }
  }

  async sendTemplate(message: EmailMessage): Promise<boolean> {
    if (!message.templateId) {
      throw new Error('Template ID is required for template emails')
    }

    try {
      if (!this.configService.get<string>('SENDGRID_API_KEY')) {
        console.log('Template email sending skipped: SENDGRID_API_KEY not configured')
        return true
      }

      await SendGrid.send({
        to: message.to,
        from: message.from || this.defaultFrom,
        subject: message.subject,
        templateId: message.templateId,
        dynamicTemplateData: message.templateData || {},
      })
      return true
    } catch (error) {
      console.error('Error sending template email via SendGrid:', error)
      return false
    }
  }
}
