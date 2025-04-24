import { Injectable } from '@nestjs/common'
import { Card } from '../entities/card.entity'
import { MailService } from './mail.service'
import { ActionType, ConditionType, TriggerType } from '../dto/column-rule-types'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateRuleDto } from '../dto/create-column-rules.dto'
import { Rule, ColumnRules } from '../interfaces/rule.interface'
import {
  AddLabelAction,
  NotifyUserAction,
  AssignDueDateAction,
  MoveToColumnAction,
  SendEmailAction,
  Action,
} from '../interfaces/action.interface'
import { Condition } from '../interfaces/condition.interface'
import { Column } from '../entities/column.entity'
import { CardHistory, HistoryActionType } from '../entities/card-history.entity'

@Injectable()
export class ColumnRulesService {
  constructor(
    private readonly mailService: MailService,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(CardHistory)
    private readonly historyRepository: Repository<CardHistory>,
  ) {}

  transformRuleDto(ruleDto: CreateRuleDto): Rule {
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

  private ensureDefaultValues(type: TriggerType, config: Record<string, any>): Record<string, any> {
    if (type === TriggerType.DUE_DATE_APPROACHING && config.daysBeforeDue === undefined) {
      return { ...config, daysBeforeDue: 3 }
    }

    return config
  }

  async processCardCreated(card: Card): Promise<void> {
    await this.processRules(card, TriggerType.CARD_CREATED)
  }

  async processCardMoved(card: Card, previousColumnId: string): Promise<void> {
    await this.processRules(card, TriggerType.CARD_MOVED, { previousColumnId })
  }

  async processDueDateApproaching(card: Card): Promise<void> {
    await this.processRules(card, TriggerType.DUE_DATE_APPROACHING)
  }

  private async processRules(card: Card, triggerType: TriggerType, context: Record<string, any> = {}): Promise<void> {
    const column = card.column

    if (!column.rules || !column.rules.enabled) {
      return
    }

    const columnRules = column.rules as unknown as ColumnRules

    if (Array.isArray(columnRules.rules)) {
      for (const rule of columnRules.rules) {
        if (!rule.enabled) continue

        if (rule.trigger.type !== triggerType || !this.matchesTriggerContext(rule.trigger, context)) {
          continue
        }

        const conditionsMet = this.evaluateConditions(card, rule.conditions as Condition[])
        if (!conditionsMet) {
          continue
        }

        await this.executeAction(card, rule.action as Action)
      }
    }
  }

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

  private evaluateConditions(card: Card, conditions: Condition[]): boolean {
    if (conditions.length === 0) {
      return true
    }

    for (const condition of conditions) {
      const result = this.evaluateCondition(card, condition)
      if (!result) {
        return false
      }
    }

    return true
  }

  private evaluateCondition(card: Card, condition: Condition): boolean {
    switch (condition.type) {
      case ConditionType.HAS_CUSTOMER:
        return !!card.customer
      case ConditionType.HAS_DUE_DATE:
        return !!card.dueDate
      case ConditionType.CUSTOM_FIELD_VALUE:
        return this.checkCustomFieldValue(card, condition.config?.fieldId, condition.config?.value)
      case ConditionType.HAS_LABEL:
        return this.checkHasLabel(card, condition.config?.labelId)
      default:
        return false
    }
  }

  private checkCustomFieldValue(card: Card, fieldId?: string, value?: string): boolean {
    if (!fieldId || !value) return false

    const customFields = (card as any).customFields || []
    return customFields.some((field: any) => field.id === fieldId && field.value === value) as boolean
  }

  private checkHasLabel(card: Card, labelId?: string): boolean {
    if (!labelId) return false

    const labels = (card as any).labels || []
    return labels.some((label: any) => label.id === labelId) as boolean
  }

  private async executeAction(card: Card, action: Rule['action']): Promise<void> {
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        await this.sendEmail(card, action as SendEmailAction)
        break
      case ActionType.MOVE_TO_COLUMN:
        await this.moveCardToColumn(card, action as MoveToColumnAction)
        break
      case ActionType.ASSIGN_DUE_DATE:
        await this.assignDueDate(card, action as AssignDueDateAction)
        break
      case ActionType.ADD_LABEL:
        await this.addLabel(card, action as AddLabelAction)
        break
      case ActionType.NOTIFY_USER:
        await this.notifyUser(card, action as NotifyUserAction)
        break
    }
  }

  private async sendEmail(card: Card, action: Rule['action']): Promise<void> {
    if (action.type !== ActionType.SEND_EMAIL) return

    const templateName = action.config?.templateName || 'card-moved'
    const to = action.config?.recipient || this.determineRecipient(card)
    const subject = action.config?.subject || this.getEmailSubject(card, action.type)

    if (templateName === 'card-moved') {
      // Get the last move history entry efficiently, only if we need it
      let oldColumnName = 'Desconocido'
      let oldColumnId = '0'

      // Only fetch history if not already available on the card
      if (!card.history || !card.history.length) {
        // Fetch only the most recent MOVED history record directly from the database
        const latestMoveHistory = await this.historyRepository
          .createQueryBuilder('history')
          .where('history.card.id = :cardId', { cardId: card.id })
          .andWhere('history.action = :action', { action: HistoryActionType.MOVED })
          .orderBy('history.createdAt', 'DESC')
          .limit(1)
          .getOne()

        if (latestMoveHistory && latestMoveHistory.changes) {
          oldColumnName = latestMoveHistory.changes.oldColumnName || 'Desconocido'
          oldColumnId = latestMoveHistory.changes.oldColumnId || '0'
        }
      } else {
        // If history is already loaded, use find in memory
        const lastMoveHistory = card.history.find((h) => h.action === HistoryActionType.MOVED)
        if (lastMoveHistory && lastMoveHistory.changes) {
          oldColumnName = lastMoveHistory.changes.oldColumnName || 'Desconocido'
          oldColumnId = lastMoveHistory.changes.oldColumnId || '0'
        }
      }

      const templateData = {
        card: {
          name: card.name,
          description: card.description || '',
          dueDate: card.dueDate ? card.dueDate.toISOString() : '',
        },
        customer: {
          name: card.customer?.name || 'Desconocido',
          email: card.customer?.email || 'Desconocido',
        },
        accountant: {
          name: card.customer?.accountant?.name || 'Desconocido',
          email: card.customer?.accountant?.email || 'Desconocido',
        },
        oldColumn: {
          name: oldColumnName,
          id: oldColumnId,
        },
        newColumn: {
          name: card.column?.name || 'Desconocido',
          id: card.column?.id || '0',
        },
        customMessage: action.config?.customMessage || '',
      }

      console.log(`Sending card-moved email with data:`, JSON.stringify(templateData))

      await this.mailService.sendCardMovedEmail(to, subject, templateData)
    } else if (templateName === 'notification') {
      // Preparar datos para la plantilla notification
      const templateData = {
        cardName: card.name,
        message: action.config?.customMessage || '',
      }

      // Log template data for debugging
      console.log(`Sending notification email with data:`, JSON.stringify(templateData))

      await this.mailService.sendNotificationEmail(to, subject, templateData)
    } else {
      // Para otros tipos de plantillas usamos el método genérico
      console.log(`Sending ${templateName} email, using generic template handler`)

      await this.mailService.sendTypedTemplateEmail(to, subject, templateName, action.config || {})
    }

    console.log(`Email sent for card ${card.id}`)
  }

  private determineRecipient(card: Card): string {
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

  private async moveCardToColumn(card: Card, action: MoveToColumnAction): Promise<void> {
    if (action.type !== ActionType.MOVE_TO_COLUMN || !action.config?.columnId) return

    console.log(`Moving card ${card.id} to column ${action.config.columnId}`)
    card.column = {
      id: action.config.columnId,
    } as Column

    await this.cardRepository.save(card)
  }

  private async assignDueDate(card: Card, action: AssignDueDateAction): Promise<void> {
    if (action.type !== ActionType.ASSIGN_DUE_DATE || !action.config?.daysFromNow) return

    const daysFromNow = action.config.daysFromNow
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)

    console.log(`Assigning due date ${dueDate.toISOString()} to card ${card.id}`)
    card.dueDate = dueDate
    await this.cardRepository.save(card)
  }

  private async addLabel(card: Card, action: AddLabelAction): Promise<void> {
    if (action.type !== ActionType.ADD_LABEL || !action.config?.labelId) return

    const labelId = action.config.labelId
    console.log(`Adding label ${labelId} to card ${card.id}`)

    if (!card.labels) {
      card.labels = []
    }
    card.labels.push(labelId)
    await this.cardRepository.save(card)
  }

  private async notifyUser(card: Card, action: NotifyUserAction): Promise<void> {
    if (action.type !== ActionType.NOTIFY_USER || !action.config?.userId || !action.config?.message) return

    console.log(`Notifying user ${action.config.userId} about card ${card.id}: ${action.config.message}`)

    const templateData = {
      cardName: card.name,
      message: action.config.message,
    }

    // Log template data for debugging
    console.log(`Sending notification email with data:`, JSON.stringify(templateData))

    await this.mailService.sendNotificationEmail(action.config.userId, action.config.message, templateData)
  }
}
