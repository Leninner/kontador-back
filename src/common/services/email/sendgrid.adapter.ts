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

      // Ensure we have valid content (html or text)
      const html = message.html || ''
      const text = message.text || ''

      // Debug content
      console.log('Email content check - HTML length:', html.length, 'Text length:', text.length)

      // Validate if both html and text are empty
      if (!html && !text) {
        console.error('Error: Email must have either html or text content')
        return false
      }

      // If html is empty or whitespace but text exists, use text as html
      const finalHtml = html && html.trim().length > 0 ? html : text || ' '

      // Always ensure there's at least some text content
      const finalText = text && text.trim().length > 0 ? text : html || ' '

      // Add a fallback space character if both are still empty after processing
      if (finalHtml.trim() === '') {
        console.warn('Warning: Using fallback content for HTML')
      }

      // Debug final content
      console.log('Final content - HTML length:', finalHtml.length, 'Text length:', finalText.length)

      await SendGrid.send({
        to: message.to,
        from: message.from || this.defaultFrom,
        subject: message.subject,
        text: finalText,
        html: finalHtml,
      })
      return true
    } catch (error) {
      console.error('Error sending email via SendGrid:', JSON.stringify(error.response?.body || error))
      if (error.response?.body?.errors) {
        console.error('SendGrid error details:', JSON.stringify(error.response.body.errors))
      }
      return false
    }
  }

  // This method is kept for interface compatibility, but redirects to the send method
  // as we're now rendering templates with Handlebars before sending
  async sendTemplate(message: EmailMessage): Promise<boolean> {
    console.warn('SendGrid templates are deprecated. Use EmailService.sendTemplateEmail instead.')
    return this.send(message)
  }
}
