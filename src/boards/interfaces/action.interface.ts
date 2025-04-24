import { ActionType } from '../dto/column-rule-types'

export interface BaseActionConfig {
  type: ActionType
  config: Record<string, any>
}

export interface SendEmailAction extends BaseActionConfig {
  type: ActionType.SEND_EMAIL
  config: {
    recipient?: string
    templateName?: string
    subject?: string
    customMessage?: string
    [key: string]: any
  }
}

export interface MoveToColumnAction extends BaseActionConfig {
  type: ActionType.MOVE_TO_COLUMN
  config: {
    columnId: string
  }
}

export interface AssignDueDateAction extends BaseActionConfig {
  type: ActionType.ASSIGN_DUE_DATE
  config: {
    daysFromNow: number
  }
}

export interface AddLabelAction extends BaseActionConfig {
  type: ActionType.ADD_LABEL
  config: {
    labelId: string
  }
}

export interface NotifyUserAction extends BaseActionConfig {
  type: ActionType.NOTIFY_USER
  config: {
    userId: string
    message: string
  }
}

export type Action = SendEmailAction | MoveToColumnAction | AssignDueDateAction | AddLabelAction | NotifyUserAction
