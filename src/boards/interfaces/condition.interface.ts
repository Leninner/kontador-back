import { ConditionType } from '../dto/column-rule-types'

export interface BaseConditionConfig {
  type: ConditionType
  config: Record<string, any>
}

export interface HasCustomerCondition extends BaseConditionConfig {
  type: ConditionType.HAS_CUSTOMER
  config: Record<string, never>
}

export interface HasDueDateCondition extends BaseConditionConfig {
  type: ConditionType.HAS_DUE_DATE
  config: Record<string, never>
}

export interface CustomFieldValueCondition extends BaseConditionConfig {
  type: ConditionType.CUSTOM_FIELD_VALUE
  config: {
    fieldId: string
    value: string
  }
}

export interface HasLabelCondition extends BaseConditionConfig {
  type: ConditionType.HAS_LABEL
  config: {
    labelId: string
  }
}

export type Condition = HasCustomerCondition | HasDueDateCondition | CustomFieldValueCondition | HasLabelCondition
