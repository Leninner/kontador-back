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
    // Only send notifications if the new column has email notifications enabled
    // and if the card has a customer linked
    if (!newColumn.sendEmailOnCardEntry || !card.customer) {
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

      // Datos comunes para todas las plantillas
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

      const subject = newColumn.emailConfig?.subject || `Card ${card.name} moved to ${newColumn.name}`

      // Si está configurado para usar SendGrid y tiene un ID de plantilla
      if (newColumn.emailConfig?.useSendgrid && newColumn.emailConfig?.sendgridTemplateId) {
        this.logger.log(`Enviando email usando plantilla de SendGrid ${newColumn.emailConfig.sendgridTemplateId}`)

        await this.mailService.sendTemplateEmail({
          to: customer.email,
          subject,
          templateId: newColumn.emailConfig.sendgridTemplateId,
          templateData,
        })
      }
      // Si tiene un nombre de plantilla local
      else if (newColumn.emailTemplateName) {
        this.logger.log(`Renderizando plantilla local ${newColumn.emailTemplateName}`)

        // Renderizar la plantilla con los datos
        const html = this.templateService.render(newColumn.emailTemplateName, templateData)

        // Enviar el email con el HTML generado
        await this.mailService.sendEmail({
          to: customer.email,
          subject,
          html,
        })
      }
      // Si tiene un mensaje personalizado en la configuración
      else if (newColumn.emailConfig?.customMessage) {
        this.logger.log(`Usando mensaje personalizado de la configuración de columna`)

        // Intentamos usar Handlebars para compilar el mensaje personalizado
        // para poder usar variables en él
        try {
          const html = this.templateService.render('custom-message', {
            ...templateData,
            customMessage: newColumn.emailConfig.customMessage,
          })

          await this.mailService.sendEmail({
            to: customer.email,
            subject,
            html,
          })
        } catch (error) {
          // Si falla, enviamos el mensaje sin procesar
          await this.mailService.sendEmail({
            to: customer.email,
            subject,
            html: newColumn.emailConfig.customMessage,
          })
        }
      }
      // En caso de no tener nada específico, usamos la plantilla predeterminada
      else {
        this.logger.log(`Usando plantilla predeterminada 'card-moved'`)

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
