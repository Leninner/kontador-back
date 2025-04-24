import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import {
  CreateColumnRulesDto,
  TriggerDto,
  ConditionDto,
  ActionDto,
  CardCreatedTriggerDto,
  CardMovedTriggerDto,
  DueDateApproachingTriggerDto,
  HasCustomerConditionDto,
  HasDueDateConditionDto,
  CustomFieldValueConditionDto,
  HasLabelConditionDto,
  SendEmailActionDto,
  MoveToColumnActionDto,
  AssignDueDateActionDto,
  AddLabelActionDto,
  NotifyUserActionDto,
  CreateRuleDto,
} from '../dto/create-column-rules.dto'
import { TriggerType, ConditionType, ActionType } from '../dto/column-rule-types'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class ColumnRulesValidationPipe implements PipeTransform {
  async transform(value: CreateColumnRulesDto): Promise<CreateColumnRulesDto> {
    if (!value || !value.rules) {
      return value
    }

    const validatedRules: CreateRuleDto[] = []

    for (const rule of value.rules) {
      // Validate trigger based on type
      await this.validateTrigger(rule.trigger)

      // Validate conditions based on type
      for (const condition of rule.conditions) {
        await this.validateCondition(condition)
      }

      // Validate action based on type
      await this.validateAction(rule.action)

      validatedRules.push(rule)
    }

    return {
      ...value,
      rules: validatedRules,
    }
  }

  private async validateTrigger(trigger: TriggerDto): Promise<void> {
    let specificTrigger

    switch (trigger.type) {
      case TriggerType.CARD_CREATED:
        specificTrigger = plainToInstance(CardCreatedTriggerDto, {
          type: trigger.type,
          config: trigger.config || {},
        })
        break
      case TriggerType.CARD_MOVED:
        specificTrigger = plainToInstance(CardMovedTriggerDto, {
          type: trigger.type,
          config: trigger.config || {},
        })
        break
      case TriggerType.DUE_DATE_APPROACHING:
        specificTrigger = plainToInstance(DueDateApproachingTriggerDto, {
          type: trigger.type,
          config: trigger.config || { daysBeforeDue: 3 },
        })
        break
      default:
        throw new BadRequestException(`Invalid trigger type: ${trigger.type as string}`)
    }

    const errors = await validate(specificTrigger)
    if (errors.length > 0) {
      throw new BadRequestException(`Trigger validation failed: ${this.formatErrors(errors)}`)
    }
  }

  private async validateCondition(condition: ConditionDto): Promise<void> {
    let specificCondition

    switch (condition.type) {
      case ConditionType.HAS_CUSTOMER:
        specificCondition = plainToInstance(HasCustomerConditionDto, {
          type: condition.type,
          config: condition.config || {},
        })
        break
      case ConditionType.HAS_DUE_DATE:
        specificCondition = plainToInstance(HasDueDateConditionDto, {
          type: condition.type,
          config: condition.config || {},
        })
        break
      case ConditionType.CUSTOM_FIELD_VALUE:
        specificCondition = plainToInstance(CustomFieldValueConditionDto, {
          type: condition.type,
          config: condition.config || {},
        })
        break
      case ConditionType.HAS_LABEL:
        specificCondition = plainToInstance(HasLabelConditionDto, {
          type: condition.type,
          config: condition.config || {},
        })
        break
      default:
        throw new BadRequestException(`Invalid condition type: ${condition.type as string}`)
    }

    const errors = await validate(specificCondition)
    if (errors.length > 0) {
      throw new BadRequestException(`Condition validation failed: ${this.formatErrors(errors)}`)
    }
  }

  private async validateAction(action: ActionDto): Promise<void> {
    let specificAction

    switch (action.type) {
      case ActionType.SEND_EMAIL:
        specificAction = plainToInstance(SendEmailActionDto, {
          type: action.type,
          config: action.config || {},
        })
        break
      case ActionType.MOVE_TO_COLUMN:
        specificAction = plainToInstance(MoveToColumnActionDto, {
          type: action.type,
          config: action.config || {},
        })
        break
      case ActionType.ASSIGN_DUE_DATE:
        specificAction = plainToInstance(AssignDueDateActionDto, {
          type: action.type,
          config: action.config || { daysFromNow: 7 },
        })
        break
      case ActionType.ADD_LABEL:
        specificAction = plainToInstance(AddLabelActionDto, {
          type: action.type,
          config: action.config || {},
        })
        break
      case ActionType.NOTIFY_USER:
        specificAction = plainToInstance(NotifyUserActionDto, {
          type: action.type,
          config: action.config || {},
        })
        break
      default:
        throw new BadRequestException(`Invalid action type: ${action.type as string}`)
    }

    const errors = await validate(specificAction)
    if (errors.length > 0) {
      throw new BadRequestException(`Action validation failed: ${this.formatErrors(errors)}`)
    }
  }

  private formatErrors(errors: any[]): string {
    return errors
      .map((err) => {
        if (err.children && err.children.length) {
          return `${err.property}: ${this.formatErrors(err.children)}`
        }
        return Object.values(err.constraints || {}).join(', ')
      })
      .join('; ')
  }
}
