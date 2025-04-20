export enum TriggerType {
  CARD_CREATED = 'card_created',
  CARD_MOVED = 'card_moved',
  DUE_DATE_APPROACHING = 'due_date_approaching',
}

export enum ConditionType {
  HAS_CUSTOMER = 'has_customer',
  HAS_DUE_DATE = 'has_due_date',
  CUSTOM_FIELD_VALUE = 'custom_field_value',
  HAS_LABEL = 'has_label',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  MOVE_TO_COLUMN = 'move_to_column',
  ASSIGN_DUE_DATE = 'assign_due_date',
  ADD_LABEL = 'add_label',
  NOTIFY_USER = 'notify_user',
}
