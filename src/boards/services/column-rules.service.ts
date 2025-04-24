import { Injectable } from '@nestjs/common'
import { Card } from '../entities/card.entity'
import { MailService } from './mail.service'
import { ActionType, ConditionType, TriggerType } from '../dto/column-rule-types'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateRuleDto } from '../dto/create-column-rules.dto'
import { Rule, ColumnRules } from '../interfaces/rule.interface'

@Injectable()
export class ColumnRulesService {
  constructor(
    private readonly mailService: MailService,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /**
   * Transform rule DTO to proper structure matching the expected interfaces
   */
  transformRuleDto(ruleDto: CreateRuleDto): Rule {
    // The rule has already been validated by the ColumnRulesValidationPipe
    // We can now directly map it to our expected structure
    return {
      id: ruleDto.id,
      name: ruleDto.name,
      enabled: ruleDto.enabled,
      trigger: {
        type: ruleDto.trigger.type,
        config: this.ensureDefaultValues(ruleDto.trigger.type, ruleDto.trigger.config || {}),
      },
      conditions: ruleDto.conditions.map((condition) => ({
        type: condition.type,
        config: condition.config || {},
      })),
      action: {
        type: ruleDto.action.type,
        config: ruleDto.action.config || {},
      },
    }
  }

  /**
   * Ensure default values for specific trigger types
   */
  private ensureDefaultValues(type: TriggerType, config: Record<string, any>): Record<string, any> {
    if (type === TriggerType.DUE_DATE_APPROACHING && config.daysBeforeDue === undefined) {
      return { ...config, daysBeforeDue: 3 }
    }

    return config
  }

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
        if (rule.trigger.type !== triggerType || !this.matchesTriggerContext(rule.trigger, context)) {
          continue
        }

        // Check all conditions
        const conditionsMet = this.evaluateConditions(card, rule.conditions)
        if (!conditionsMet) {
          continue
        }

        // Execute the action
        this.executeAction(card, rule.action)
      }
    }
  }

  /**
   * Checks if a trigger matches the provided context
   */
  private matchesTriggerContext(trigger: Rule['trigger'], context: Record<string, any>): boolean {
    switch (trigger.type) {
      case TriggerType.CARD_MOVED:
        if (trigger.config?.fromColumnId) {
          return trigger.config.fromColumnId === context.previousColumnId
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
  private evaluateConditions(card: Card, conditions: Rule['conditions']): boolean {
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
  private evaluateCondition(card: Card, condition: Rule['conditions'][0]): boolean {
    switch (condition.type) {
      case ConditionType.HAS_CUSTOMER:
        return !!card.customer
      case ConditionType.HAS_DUE_DATE:
        return !!card.dueDate
      case ConditionType.CUSTOM_FIELD_VALUE:
        // Check if the card has the specified custom field with the specified value
        return this.checkCustomFieldValue(card, condition.config?.fieldId, condition.config?.value)
      case ConditionType.HAS_LABEL:
        return this.checkHasLabel(card, condition.config?.labelId)
      default:
        return false
    }
  }

  /**
   * Checks if a card has a custom field with a specific value
   */
  private checkCustomFieldValue(card: Card, fieldId?: string, value?: string): boolean {
    if (!fieldId || !value) return false

    // Access card.customFields safely
    const customFields = (card as any).customFields || []
    return customFields.some((field: any) => field.id === fieldId && field.value === value) as boolean
  }

  /**
   * Checks if a card has a specific label
   */
  private checkHasLabel(card: Card, labelId?: string): boolean {
    if (!labelId) return false

    // Access card.labels safely
    const labels = (card as any).labels || []
    return labels.some((label: any) => label.id === labelId) as boolean
  }

  /**
   * Executes a single action
   */
  private executeAction(card: Card, action: Rule['action']): void {
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

  private sendEmail(card: Card, action: Rule['action']): void {
    if (action.type !== ActionType.SEND_EMAIL) return

    // Implementation using MailService
    const emailData = {
      to: action.config?.recipient || this.determineRecipient(card),
      subject: action.config?.subject || this.getEmailSubject(card, action.type),
      templateId: action.config?.templateName || 'card-moved',
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

  private moveCardToColumn(card: Card, action: Rule['action']): void {
    if (action.type !== ActionType.MOVE_TO_COLUMN || !action.config?.columnId) return

    // Implementation would update the card's column
    console.log(`Moving card ${card.id} to column ${action.config.columnId}`)
  }

  private assignDueDate(card: Card, action: Rule['action']): void {
    if (action.type !== ActionType.ASSIGN_DUE_DATE || !action.config?.daysFromNow) return

    const daysFromNow = action.config.daysFromNow
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)

    // Implementation would update the card's due date
    console.log(`Assigning due date ${dueDate.toISOString()} to card ${card.id}`)
  }

  private async addLabel(card: Card, action: Rule['action']): Promise<void> {
    if (action.type !== ActionType.ADD_LABEL || !action.config?.labelId) return

    // Implementation would add a label to the card
    const labelId = action.config.labelId
    console.log(`Adding label ${labelId} to card ${card.id}`)

    // Add the label to the card (assuming labels is an array of strings)
    if (!card.labels) {
      card.labels = []
    }
    card.labels.push(labelId)
    await this.cardRepository.save(card)
  }

  private notifyUser(card: Card, action: Rule['action']): void {
    if (action.type !== ActionType.NOTIFY_USER || !action.config?.userId || !action.config?.message) return

    // In a real implementation, this would connect to a notification system
    console.log(`Notifying user ${action.config.userId} about card ${card.id}: ${action.config.message}`)
  }
}
