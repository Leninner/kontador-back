import { Injectable } from '@nestjs/common'
import { EmailService } from '../../common/services/email/email.service'
import { EmailMessage } from '../../common/interfaces/email.interface'
import { TemplateService } from '../../common/services/email/template.service'

@Injectable()
export class MailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      return await this.emailService.sendEmail(message)
    } catch (error) {
      console.error('Error in MailService.sendEmail:', error)
      return false
    }
  }

  async sendTemplateEmail(message: EmailMessage): Promise<boolean> {
    try {
      return await this.emailService.sendTemplateEmail(message)
    } catch (error) {
      console.error('Error in MailService.sendTemplateEmail:', error)
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
      const html = this.templateService.render(templateName, data)
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
}
