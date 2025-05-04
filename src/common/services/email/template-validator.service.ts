import { Injectable } from '@nestjs/common'
import {
  TemplateDataMap,
  CardMovedTemplateData,
  NotificationTemplateData,
  CustomerLinkedTemplateData,
  CustomMessageTemplateData,
  CardInfo,
  CustomerInfo,
  AccountantInfo,
  ColumnInfo,
} from '../../interfaces/email.interface'

/**
 * Servicio para validar y preparar datos para las plantillas de email
 */
@Injectable()
export class TemplateValidatorService {
  /**
   * Valida y completa los datos para cualquier plantilla
   */
  validateTemplateData<T extends keyof TemplateDataMap>(
    templateName: T & string,
    data: Partial<TemplateDataMap[T]>,
  ): TemplateDataMap[T] {
    switch (templateName) {
      case 'card-moved':
        return this.validateCardMovedTemplate(data as Partial<CardMovedTemplateData>) as TemplateDataMap[T]
      case 'notification':
        return this.validateNotificationTemplate(data as Partial<NotificationTemplateData>) as TemplateDataMap[T]
      case 'customer-linked':
        return this.validateCustomerLinkedTemplate(data as Partial<CustomerLinkedTemplateData>) as TemplateDataMap[T]
      case 'custom-message':
        return this.validateCustomMessageTemplate(data as Partial<CustomMessageTemplateData>) as TemplateDataMap[T]
      default:
        // Si es una plantilla desconocida, devolvemos los datos tal cual
        return data as TemplateDataMap[T]
    }
  }

  /**
   * Validación de plantilla card-moved
   */
  private validateCardMovedTemplate(data: Partial<CardMovedTemplateData>): CardMovedTemplateData {
    const card: CardInfo = this.validateCardInfo(data.card)
    const customer: CustomerInfo = this.validateCustomerInfo(data.customer)
    const accountant: AccountantInfo = this.validateAccountantInfo(data.accountant)
    const oldColumn: ColumnInfo = this.validateColumnInfo(data.oldColumn)
    const newColumn: ColumnInfo = this.validateColumnInfo(data.newColumn)

    return {
      card,
      customer,
      accountant,
      oldColumn,
      newColumn,
      currentYear: new Date().getFullYear(),
    }
  }

  /**
   * Validación de plantilla notification
   */
  private validateNotificationTemplate(data: Partial<NotificationTemplateData>): NotificationTemplateData {
    return {
      cardName: data.cardName || '',
      message: data.message || '',
    }
  }

  /**
   * Validación de plantilla customer-linked
   */
  private validateCustomerLinkedTemplate(data: Partial<CustomerLinkedTemplateData>): CustomerLinkedTemplateData {
    // Verificar y completar objetos card, customer, accountant, column
    const card: CardInfo = this.validateCardInfo(data.card)
    const customer: CustomerInfo = this.validateCustomerInfo(data.customer)
    const accountant: AccountantInfo = this.validateAccountantInfo(data.accountant)
    const column: ColumnInfo = this.validateColumnInfo(data.column)

    return {
      card,
      customer,
      accountant,
      column,
      currentYear: new Date().getFullYear(),
    }
  }

  /**
   * Validación de plantilla custom-message
   */
  private validateCustomMessageTemplate(data: Partial<CustomMessageTemplateData>): CustomMessageTemplateData {
    return {
      customMessage: data.customMessage || 'No hay mensaje personalizado disponible.',
      currentYear: new Date().getFullYear(),
    }
  }

  /**
   * Validación de información de tarjeta
   */
  private validateCardInfo(card?: Partial<CardInfo>): CardInfo {
    if (!card) {
      return {
        name: 'Tarjeta sin nombre',
      }
    }

    return {
      name: card.name || 'Tarjeta sin nombre',
      description: card.description || '',
      dueDate: card.dueDate || '',
    }
  }

  /**
   * Validación de información de cliente
   */
  private validateCustomerInfo(customer?: Partial<CustomerInfo>): CustomerInfo {
    if (!customer) {
      return {
        name: 'Cliente',
        email: 'cliente@example.com',
      }
    }

    return {
      name: customer.name || 'Cliente',
      email: customer.email || 'cliente@example.com',
    }
  }

  /**
   * Validación de información de contador
   */
  private validateAccountantInfo(accountant?: Partial<AccountantInfo>): AccountantInfo {
    if (!accountant) {
      return {
        name: 'Contador',
        email: 'contador@kontador.app',
      }
    }

    return {
      name: accountant.name || 'Contador',
      email: accountant.email || 'contador@kontador.app',
    }
  }

  /**
   * Validación de información de columna
   */
  private validateColumnInfo(column?: Partial<ColumnInfo>): ColumnInfo {
    if (!column) {
      return {
        name: 'Columna',
        id: '0',
      }
    }

    return {
      name: column.name || 'Columna',
      id: column.id || '0',
    }
  }

  /**
   * Adaptar datos planos a la estructura de la plantilla
   * Útil para datos que llegan desde APIs externas o formularios
   */
  adaptToCardMovedTemplate(
    cardName: string,
    cardDescription: string = '',
    customerName: string,
    customerEmail: string,
    accountantName: string,
    accountantEmail: string,
    oldColumnName: string,
    newColumnName: string,
    dueDate?: string,
  ): CardMovedTemplateData {
    return {
      card: {
        name: cardName,
        description: cardDescription,
        dueDate: dueDate || '',
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
      accountant: {
        name: accountantName,
        email: accountantEmail,
      },
      oldColumn: {
        name: oldColumnName,
        id: '0',
      },
      newColumn: {
        name: newColumnName,
        id: '0',
      },
      currentYear: new Date().getFullYear(),
    }
  }
}
