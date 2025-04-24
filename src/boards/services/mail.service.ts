import { Injectable } from '@nestjs/common'
import { EmailService } from '../../common/services/email/email.service'
import {
  EmailMessage,
  TemplateDataMap,
  CardMovedTemplateData,
  NotificationTemplateData,
} from '../../common/interfaces/email.interface'
import { TemplateService } from '../../common/services/email/template.service'
import { TemplateValidatorService } from '../../common/services/email/template-validator.service'

@Injectable()
export class MailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
    private readonly templateValidator: TemplateValidatorService,
  ) {}

  async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      return await this.emailService.sendEmail(message)
    } catch (error) {
      console.error('Error in MailService.sendEmail:', JSON.stringify(error.response?.body || error))
      return false
    }
  }

  async sendTemplateEmail(message: EmailMessage): Promise<boolean> {
    try {
      return await this.emailService.sendTemplateEmail(message)
    } catch (error) {
      console.error('Error in MailService.sendTemplateEmail:', JSON.stringify(error.response?.body || error))
      return false
    }
  }

  async renderAndSendEmail(
    templateName: string,
    data: Record<string, any>,
    to: string,
    subject: string,
  ): Promise<boolean> {
    try {
      // Validar los datos primero
      const validatedData = this.templateValidator.validateTemplateData(templateName, data)

      const html = this.templateService.render(templateName, validatedData)

      // Ensure we have content
      if (!html || html.trim() === '') {
        console.error(`Empty template rendering for ${templateName}`)
        return false
      }

      return await this.sendEmail({
        to,
        subject,
        html,
      })
    } catch (error) {
      console.error(`Error rendering and sending email template ${templateName}:`, error)
      return false
    }
  }

  // Nuevos métodos tipificados para plantillas específicas
  async sendCardMovedEmail(to: string, subject: string, data: Partial<CardMovedTemplateData>): Promise<boolean> {
    try {
      return await this.emailService.sendTypedTemplateEmail(to, subject, 'card-moved', data)
    } catch (error) {
      console.error('Error sending card-moved email:', error)
      return false
    }
  }

  async sendNotificationEmail(to: string, subject: string, data: Partial<NotificationTemplateData>): Promise<boolean> {
    try {
      return await this.emailService.sendTypedTemplateEmail(to, subject, 'notification', data)
    } catch (error) {
      console.error('Error sending notification email:', error)
      return false
    }
  }

  // Método genérico para cualquier plantilla tipificada
  async sendTypedTemplateEmail<T extends keyof TemplateDataMap>(
    to: string,
    subject: string,
    templateName: T & string,
    data: Partial<TemplateDataMap[T]>,
  ): Promise<boolean> {
    try {
      return await this.emailService.sendTypedTemplateEmail(to, subject, templateName, data)
    } catch (error) {
      console.error(`Error sending ${templateName} email:`, error)
      return false
    }
  }
}
