import { Injectable, Logger } from '@nestjs/common'
import { Card } from '../entities/card.entity'
import { Column } from '../entities/column.entity'
import { Customer } from '../../customers/entities/customer.entity'
import { User } from '../../auth/entities/user.entity'
import { MailService } from './mail.service'
import { TemplateService } from '../../common/services/email/template.service'

@Injectable()
export class CardNotificationService {
  private readonly logger = new Logger(CardNotificationService.name)

  constructor(
    private readonly mailService: MailService,
    private readonly templateService: TemplateService,
  ) {}

  async handleCardMoved(card: Card, oldColumn: Column, newColumn: Column, user: User): Promise<void> {
    // Check if there are rules configured for sending emails
    if (!newColumn.rules || !newColumn.rules.enabled || !card.customer) {
      return
    }

    // Check if there's a send_email action in the rules
    const hasEmailAction = newColumn.rules.rules?.some((action) => action.action.type === 'send_email')
    if (!hasEmailAction) {
      return
    }

    await this.sendCardMovedNotification(card, card.customer, oldColumn, newColumn, user)
  }

  private async sendCardMovedNotification(
    card: Card,
    customer: Customer,
    oldColumn: Column,
    newColumn: Column,
    user: User,
  ): Promise<void> {
    try {
      if (!customer.email) {
        this.logger.warn(`Cannot send email notification: Customer ${customer.id} has no email address`)
        return
      }

      // Common data for all templates
      const templateData = {
        customer: {
          name: customer.name,
          lastName: customer.lastName,
          documentId: customer.documentId,
        },
        card: {
          id: card.id,
          name: card.name,
          description: card.description,
          dueDate: card.dueDate ? new Date(card.dueDate).toLocaleDateString() : null,
        },
        oldColumn: {
          name: oldColumn.name,
        },
        newColumn: {
          name: newColumn.name,
        },
        column: {
          name: newColumn.name,
        },
        accountant: {
          name: user.name,
          email: user.email,
        },
        currentYear: new Date().getFullYear(),
      }

      // Find the email action configuration
      const emailAction = newColumn.rules.rules?.find((action) => action.action.type === 'send_email')
      if (!emailAction) {
        return
      }

      const emailConfig = emailAction.action.config || {}
      const subject = emailConfig.subject || `Card ${card.name} moved to ${newColumn.name}`

      // If configured to use SendGrid with a template ID
      if (emailConfig.useSendgrid && emailConfig.sendgridTemplateId) {
        this.logger.log(`Sending email using SendGrid template ${emailConfig.sendgridTemplateId}`)

        await this.mailService.sendTemplateEmail({
          to: customer.email,
          subject,
          templateId: emailConfig.sendgridTemplateId,
          templateData,
        })
      }
      // If using a local template name
      else if (emailConfig.templateName) {
        this.logger.log(`Rendering local template ${emailConfig.templateName}`)

        // Render template with data
        const html = this.templateService.render(emailConfig.templateName, templateData)

        // Send email with generated HTML
        await this.mailService.sendEmail({
          to: customer.email,
          subject,
          html,
        })
      }
      // If using a custom message in the configuration
      else if (emailConfig.customMessage) {
        this.logger.log(`Using custom message from column configuration`)

        // Try to use Handlebars to compile the custom message
        // to support variables
        try {
          const html = this.templateService.render('custom-message', {
            ...templateData,
            customMessage: emailConfig.customMessage,
          })

          await this.mailService.sendEmail({
            to: customer.email,
            subject,
            html,
          })
        } catch (error) {
          this.logger.error(`Failed to render custom message: ${error.message}`, error.stack)
          // If it fails, send the raw message
          await this.mailService.sendEmail({
            to: customer.email,
            subject,
            html: emailConfig.customMessage,
          })
        }
      }
      // If nothing specific is configured, use the default template
      else {
        this.logger.log(`Using default template 'card-moved'`)

        const html = this.templateService.render('card-moved', templateData)

        await this.mailService.sendEmail({
          to: customer.email,
          subject,
          html,
        })
      }

      this.logger.log(`Notification email sent to customer ${customer.id} for card ${card.id}`)
    } catch (error) {
      this.logger.error(`Failed to send card notification email: ${error.message}`, error.stack)
    }
  }
}
