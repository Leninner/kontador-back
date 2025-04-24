import { ActionType, ConditionType, TriggerType } from '../dto/column-rule-types'

export interface Rule {
  id: string
  name: string
  enabled: boolean
  trigger: {
    type: TriggerType
    config: Record<string, any>
  }
  conditions: Array<{
    type: ConditionType
    config: Record<string, any>
  }>
  action: {
    type: ActionType
    config: Record<string, any>
  }
}

export interface ColumnRules {
  enabled: boolean
  rules: Rule[]
}
