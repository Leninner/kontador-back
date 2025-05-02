export enum IntentType {
  GET_CUSTOMER = 'GET_CUSTOMER',
  CREATE_TASK = 'CREATE_TASK',
  SAVE_INVOICE = 'SAVE_INVOICE',
  UNKNOWN = 'UNKNOWN',
}

export interface ICreateTaskIntent {
  task_name: string
  description?: string
  due_date?: string
  priority?: string
  customer_id?: string
}
