export interface EmailMessage {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
  templateName?: string
  templateData?: Record<string, any>
}

export interface IEmailAdapter {
  send(message: EmailMessage): Promise<boolean>
  sendTemplate(message: EmailMessage): Promise<boolean>
}

// Interfaces básicas para objetos reutilizables en los templates
export interface AccountantInfo {
  name: string
  email: string
}

export interface CustomerInfo {
  name: string
  email: string
}

export interface CardInfo {
  name: string
  description?: string
  dueDate?: string
}

export interface ColumnInfo {
  name: string
  id: string
}

// Interfaces para datos de plantillas específicas
export interface CardMovedTemplateData {
  card: CardInfo
  customer: CustomerInfo
  accountant: AccountantInfo
  oldColumn: ColumnInfo
  newColumn: ColumnInfo
  currentYear?: number
}

export interface NotificationTemplateData {
  cardName?: string
  message?: string
}

export interface CustomerLinkedTemplateData {
  customer: CustomerInfo
  card: CardInfo
  column: ColumnInfo
  accountant: AccountantInfo
  currentYear?: number
}

export interface CustomMessageTemplateData {
  customMessage: string
  currentYear?: number
}

// Mapeo de nombres de plantillas a sus tipos de datos
export type TemplateDataMap = {
  'card-moved': CardMovedTemplateData
  notification: NotificationTemplateData
  'customer-linked': CustomerLinkedTemplateData
  'custom-message': CustomMessageTemplateData
  [key: string]: Record<string, any>
}

// Función de ayuda para crear un email con plantilla tipificada
export function createTemplateEmail<T extends keyof TemplateDataMap>(
  to: string,
  subject: string,
  templateName: T & string,
  templateData: TemplateDataMap[T],
  from?: string,
): EmailMessage {
  return {
    to,
    subject,
    templateName,
    templateData,
    from,
  }
}
