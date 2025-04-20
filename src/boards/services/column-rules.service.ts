import { Injectable } from '@nestjs/common'
import { Card } from '../entities/card.entity'
import { MailService } from './mail.service'
import { ActionType, ConditionType, TriggerType } from '../dto/column-rule-types'

// Reuse the type aliases from the enum types
export type { TriggerType, ConditionType, ActionType }

export interface BaseTriggerConfig {
  type: TriggerType
}

export interface CardCreatedTrigger extends BaseTriggerConfig {
  type: TriggerType.CARD_CREATED
}

export interface CardMovedTrigger extends BaseTriggerConfig {
  type: TriggerType.CARD_MOVED
  fromColumnId?: string
}

export interface DueDateApproachingTrigger extends BaseTriggerConfig {
  type: TriggerType.DUE_DATE_APPROACHING
  daysBeforeDue: number
}

export type Trigger = CardCreatedTrigger | CardMovedTrigger | DueDateApproachingTrigger

export interface BaseConditionConfig {
  type: ConditionType
}

export interface HasCustomerCondition extends BaseConditionConfig {
  type: ConditionType.HAS_CUSTOMER
}

export interface HasDueDateCondition extends BaseConditionConfig {
  type: ConditionType.HAS_DUE_DATE
}

export interface CustomFieldValueCondition extends BaseConditionConfig {
  type: ConditionType.CUSTOM_FIELD_VALUE
  fieldId: string
  value: string
}

export interface HasLabelCondition extends BaseConditionConfig {
  type: ConditionType.HAS_LABEL
  labelId: string
}

export type Condition = HasCustomerCondition | HasDueDateCondition | CustomFieldValueCondition | HasLabelCondition

export interface BaseActionConfig {
  type: ActionType
}

export interface SendEmailAction extends BaseActionConfig {
  type: ActionType.SEND_EMAIL
  recipient?: string
  template?: string
  config?: {
    subject?: string
    templateName?: string
    customMessage?: string
    [key: string]: any
  }
}

export interface MoveToColumnAction extends BaseActionConfig {
  type: ActionType.MOVE_TO_COLUMN
  columnId: string
}

export interface AssignDueDateAction extends BaseActionConfig {
  type: ActionType.ASSIGN_DUE_DATE
  daysFromNow: number
}

export interface AddLabelAction extends BaseActionConfig {
  type: ActionType.ADD_LABEL
  labelId: string
}

export interface NotifyUserAction extends BaseActionConfig {
  type: ActionType.NOTIFY_USER
  userId: string
  message: string
}

export type Action = SendEmailAction | MoveToColumnAction | AssignDueDateAction | AddLabelAction | NotifyUserAction

// Rule interface matching the frontend structure
export interface Rule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: TriggerType
    config?: Record<string, any>
  }
  conditions: Array<{
    type: ConditionType
    config?: Record<string, any>
  }>
  action: {
    type: ActionType
    config?: Record<string, any>
  }
}

export interface ColumnRules {
  enabled: boolean
  rules: Rule[]
}

@Injectable()
export class ColumnRulesService {
  constructor(private readonly mailService: MailService) {}

  /**
   * Processes rules when a card is created
   */
  processCardCreated(card: Card): void {
    this.processRules(card, TriggerType.CARD_CREATED)
  }

  /**
   * Processes rules when a card is moved
   */
  processCardMoved(card: Card, previousColumnId: string): void {
    this.processRules(card, TriggerType.CARD_MOVED, { previousColumnId })
  }

  /**
   * Processes rules when a card's due date is approaching
   */
  processDueDateApproaching(card: Card): void {
    this.processRules(card, TriggerType.DUE_DATE_APPROACHING)
  }

  /**
   * Processes all rules for a given trigger
   */
  private processRules(card: Card, triggerType: TriggerType, context: Record<string, any> = {}): void {
    const column = card.column

    if (!column.rules || !column.rules.enabled) {
      return
    }

    const columnRules = column.rules as unknown as ColumnRules

    // Process each rule that matches the trigger type
    if (Array.isArray(columnRules.rules)) {
      for (const rule of columnRules.rules) {
        // Skip disabled rules
        if (!rule.enabled) continue

        // Check if the rule's trigger matches
        if (
          rule.trigger.type !== triggerType ||
          !this.matchesTriggerContext(rule.trigger as unknown as Trigger, context)
        ) {
          continue
        }

        // Check all conditions
        const conditionsMet = this.evaluateConditions(card, rule.conditions as unknown as Condition[])
        if (!conditionsMet) {
          continue
        }

        // Execute the action
        this.executeAction(card, rule.action as unknown as Action)
      }
    }
  }

  /**
   * Checks if a trigger matches the provided context
   */
  private matchesTriggerContext(trigger: Trigger, context: Record<string, any>): boolean {
    switch (trigger.type) {
      case TriggerType.CARD_MOVED:
        if ('fromColumnId' in trigger && trigger.fromColumnId) {
          return trigger.fromColumnId === context.previousColumnId
        }
        return true
      case TriggerType.DUE_DATE_APPROACHING:
        // This would require additional logic to check if the due date is approaching
        return true
      default:
        return true
    }
  }

  /**
   * Evaluates all conditions for a card
   */
  private evaluateConditions(card: Card, conditions: Condition[]): boolean {
    if (conditions.length === 0) {
      return true // No conditions means all conditions are met
    }

    for (const condition of conditions) {
      const result = this.evaluateCondition(card, condition)
      if (!result) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluates a single condition
   */
  private evaluateCondition(card: Card, condition: Condition): boolean {
    switch (condition.type) {
      case ConditionType.HAS_CUSTOMER:
        return !!card.customer
      case ConditionType.HAS_DUE_DATE:
        return !!card.dueDate
      case ConditionType.CUSTOM_FIELD_VALUE:
        // Check if the card has the specified custom field with the specified value
        return this.checkCustomFieldValue(card, condition.fieldId, condition.value)
      case ConditionType.HAS_LABEL:
        return this.checkHasLabel(card, condition.labelId)
      default:
        return false
    }
  }

  /**
   * Checks if a card has a custom field with a specific value
   */
  private checkCustomFieldValue(card: Card, fieldId: string, value: string): boolean {
    // Access card.customFields safely
    const customFields = (card as any).customFields || []
    return customFields.some((field: any) => field.id === fieldId && field.value === value) as boolean
  }

  /**
   * Checks if a card has a specific label
   */
  private checkHasLabel(card: Card, labelId: string): boolean {
    // Access card.labels safely
    const labels = (card as any).labels || []
    return labels.some((label: any) => label.id === labelId) as boolean
  }

  /**
   * Executes a single action
   */
  private executeAction(card: Card, action: Action): void {
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        this.sendEmail(card, action)
        break
      case ActionType.MOVE_TO_COLUMN:
        this.moveCardToColumn(card, action)
        break
      case ActionType.ASSIGN_DUE_DATE:
        this.assignDueDate(card, action)
        break
      case ActionType.ADD_LABEL:
        this.addLabel(card, action)
        break
      case ActionType.NOTIFY_USER:
        this.notifyUser(card, action)
        break
    }
  }

  private sendEmail(card: Card, action: SendEmailAction): void {
    // Implementation using MailService
    const emailData = {
      to: action.recipient || this.determineRecipient(card),
      subject: action.config?.subject || this.getEmailSubject(card, action.type),
      templateId: action.config?.templateName || action.template || 'card-moved',
      templateData: {
        cardName: card.name,
        cardDescription: card.description || '',
        dueDate: card.dueDate ? card.dueDate.toISOString() : '',
        customerName: card.customer?.name || 'No customer',
        columnName: card.column?.name || '',
        customMessage: action.config?.customMessage || '',
      },
    }

    this.mailService.sendTemplateEmail(emailData).catch((error) => {
      console.error(`Error sending email for card ${card.id}:`, error)
    })
  }

  private determineRecipient(card: Card): string {
    // Determine appropriate recipient based on card data
    return card.customer?.email || 'admin@example.com'
  }

  private getEmailSubject(card: Card, actionType: ActionType): string {
    switch (actionType) {
      case ActionType.SEND_EMAIL:
        return `Notificación: ${card.name}`
      default:
        return `Notificación para tarjeta: ${card.name}`
    }
  }

  private moveCardToColumn(card: Card, action: MoveToColumnAction): void {
    // Implementation would update the card's column
    console.log(`Moving card ${card.id} to column ${action.columnId}`)
  }

  private assignDueDate(card: Card, action: AssignDueDateAction): void {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + action.daysFromNow)

    // Implementation would update the card's due date
    console.log(`Assigning due date ${dueDate.toISOString()} to card ${card.id}`)
  }

  private addLabel(card: Card, action: AddLabelAction): void {
    // Implementation would add a label to the card
    console.log(`Adding label ${action.labelId} to card ${card.id}`)
  }

  private notifyUser(card: Card, action: NotifyUserAction): void {
    // In a real implementation, this would connect to a notification system
    // For now, we'll just log it
    console.log(`Notifying user ${action.userId} about card ${card.id}: ${action.message}`)
  }
}
