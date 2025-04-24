import { TriggerType } from '../dto/column-rule-types'

export interface BaseTriggerConfig {
  type: TriggerType
  config: Record<string, any>
}

export interface CardCreatedTrigger extends BaseTriggerConfig {
  type: TriggerType.CARD_CREATED
  config: Record<string, never>
}

export interface CardMovedTrigger extends BaseTriggerConfig {
  type: TriggerType.CARD_MOVED
  config: {
    fromColumnId?: string
  }
}

export interface DueDateApproachingTrigger extends BaseTriggerConfig {
  type: TriggerType.DUE_DATE_APPROACHING
  config: {
    daysBeforeDue: number
  }
}

export type Trigger = CardCreatedTrigger | CardMovedTrigger | DueDateApproachingTrigger
