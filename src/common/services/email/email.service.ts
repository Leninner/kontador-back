import { Injectable } from '@nestjs/common'
import { EmailMessage, TemplateDataMap, createTemplateEmail } from '../../interfaces/email.interface'
import { SendGridAdapter } from './sendgrid.adapter'
import { TemplateService } from './template.service'
import { TemplateValidatorService } from './template-validator.service'

@Injectable()
export class EmailService {
  constructor(
    private readonly emailAdapter: SendGridAdapter,
    private readonly templateService: TemplateService,
    private readonly templateValidator: TemplateValidatorService,
  ) {}

  async sendEmail(message: EmailMessage): Promise<boolean> {
    return this.emailAdapter.send(message)
  }

  async sendTemplateEmail(message: EmailMessage): Promise<boolean> {
    if (!message.templateName) {
      throw new Error('Template name is required for template emails')
    }

    // Validar los datos de la plantilla
    const validatedData = this.templateValidator.validateTemplateData(message.templateName, message.templateData || {})

    // Render the template using TemplateService with validated data
    const htmlContent = this.templateService.render(message.templateName, validatedData)

    // Validate content
    if (!htmlContent || htmlContent.trim() === '') {
      throw new Error(`Template ${message.templateName} rendered empty content`)
    }

    // Create new message with rendered HTML
    const emailToSend: EmailMessage = {
      ...message,
      html: htmlContent,
    }

    // Send using the regular send method
    return this.emailAdapter.send(emailToSend)
  }

  // Método tipificado para enviar emails con plantilla específica
  async sendTypedTemplateEmail<T extends keyof TemplateDataMap>(
    to: string,
    subject: string,
    templateName: T & string,
    templateData: Partial<TemplateDataMap[T]>,
    from?: string,
  ): Promise<boolean> {
    // Validar los datos de la plantilla
    const validatedData = this.templateValidator.validateTemplateData(templateName, templateData)

    const message = createTemplateEmail(to, subject, templateName, validatedData, from)
    return this.sendTemplateEmail(message)
  }
}
