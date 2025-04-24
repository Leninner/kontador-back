import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { ActionType, ConditionType, TriggerType } from './column-rule-types'

// Trigger config DTOs
export class CardMovedTriggerConfigDto {
  @IsString()
  @IsOptional()
  fromColumnId?: string
}

export class DueDateApproachingTriggerConfigDto {
  @IsNumber()
  @IsOptional()
  daysBeforeDue?: number = 3
}

// Trigger DTO classes
export class BaseTriggerConfigDto {
  @IsEnum(TriggerType)
  type: TriggerType
}

export class CardCreatedTriggerDto extends BaseTriggerConfigDto {
  readonly type = TriggerType.CARD_CREATED

  @IsObject()
  @IsOptional()
  config?: Record<string, never>
}

export class CardMovedTriggerDto extends BaseTriggerConfigDto {
  readonly type = TriggerType.CARD_MOVED

  @IsOptional()
  @ValidateNested()
  @Type(() => CardMovedTriggerConfigDto)
  config?: CardMovedTriggerConfigDto
}

export class DueDateApproachingTriggerDto extends BaseTriggerConfigDto {
  readonly type = TriggerType.DUE_DATE_APPROACHING

  @ValidateNested()
  @Type(() => DueDateApproachingTriggerConfigDto)
  config: DueDateApproachingTriggerConfigDto
}

// Generic trigger DTO that can contain any of the specific trigger types
export class TriggerDto {
  @IsEnum(TriggerType)
  type: TriggerType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>
}

// Condition config DTOs
export class CustomFieldValueConditionConfigDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string

  @IsString()
  @IsNotEmpty()
  value: string
}

export class HasLabelConditionConfigDto {
  @IsString()
  @IsNotEmpty()
  labelId: string
}

// Condition DTO classes
export class BaseConditionConfigDto {
  @IsEnum(ConditionType)
  type: ConditionType
}

export class HasCustomerConditionDto extends BaseConditionConfigDto {
  readonly type = ConditionType.HAS_CUSTOMER

  @IsObject()
  @IsOptional()
  config?: Record<string, never>
}

export class HasDueDateConditionDto extends BaseConditionConfigDto {
  readonly type = ConditionType.HAS_DUE_DATE

  @IsObject()
  @IsOptional()
  config?: Record<string, never>
}

export class CustomFieldValueConditionDto extends BaseConditionConfigDto {
  readonly type = ConditionType.CUSTOM_FIELD_VALUE

  @ValidateNested()
  @Type(() => CustomFieldValueConditionConfigDto)
  config: CustomFieldValueConditionConfigDto
}

export class HasLabelConditionDto extends BaseConditionConfigDto {
  readonly type = ConditionType.HAS_LABEL

  @ValidateNested()
  @Type(() => HasLabelConditionConfigDto)
  config: HasLabelConditionConfigDto
}

// Generic condition DTO
export class ConditionDto {
  @IsEnum(ConditionType)
  type: ConditionType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>
}

// Action config DTOs
export class SendEmailActionConfigDto {
  @IsString()
  @IsOptional()
  recipient?: string

  @IsString()
  @IsOptional()
  templateName?: string

  @IsString()
  @IsOptional()
  subject?: string

  @IsString()
  @IsOptional()
  customMessage?: string
}

export class MoveToColumnActionConfigDto {
  @IsString()
  @IsNotEmpty()
  columnId: string
}

export class AssignDueDateActionConfigDto {
  @IsNumber()
  @IsNotEmpty()
  daysFromNow: number = 7
}

export class AddLabelActionConfigDto {
  @IsString()
  @IsNotEmpty()
  labelId: string
}

export class NotifyUserActionConfigDto {
  @IsString()
  @IsNotEmpty()
  userId: string

  @IsString()
  @IsNotEmpty()
  message: string
}

// Action DTO classes
export class BaseActionConfigDto {
  @IsEnum(ActionType)
  type: ActionType
}

export class SendEmailActionDto extends BaseActionConfigDto {
  readonly type = ActionType.SEND_EMAIL

  @ValidateNested()
  @Type(() => SendEmailActionConfigDto)
  @IsOptional()
  config?: SendEmailActionConfigDto
}

export class MoveToColumnActionDto extends BaseActionConfigDto {
  readonly type = ActionType.MOVE_TO_COLUMN

  @ValidateNested()
  @Type(() => MoveToColumnActionConfigDto)
  config: MoveToColumnActionConfigDto
}

export class AssignDueDateActionDto extends BaseActionConfigDto {
  readonly type = ActionType.ASSIGN_DUE_DATE

  @ValidateNested()
  @Type(() => AssignDueDateActionConfigDto)
  config: AssignDueDateActionConfigDto
}

export class AddLabelActionDto extends BaseActionConfigDto {
  readonly type = ActionType.ADD_LABEL

  @ValidateNested()
  @Type(() => AddLabelActionConfigDto)
  config: AddLabelActionConfigDto
}

export class NotifyUserActionDto extends BaseActionConfigDto {
  readonly type = ActionType.NOTIFY_USER

  @ValidateNested()
  @Type(() => NotifyUserActionConfigDto)
  config: NotifyUserActionConfigDto
}

export class ActionDto {
  @IsEnum(ActionType)
  type: ActionType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>

  @ValidateIf((o) => o.type === ActionType.SEND_EMAIL)
  @ValidateNested()
  @Type(() => SendEmailActionDto)
  sendEmailAction?: SendEmailActionDto

  @ValidateIf((o) => o.type === ActionType.MOVE_TO_COLUMN)
  @ValidateNested()
  @Type(() => MoveToColumnActionDto)
  moveToColumnAction?: MoveToColumnActionDto

  @ValidateIf((o) => o.type === ActionType.ASSIGN_DUE_DATE)
  @ValidateNested()
  @Type(() => AssignDueDateActionDto)
  assignDueDateAction?: AssignDueDateActionDto

  @ValidateIf((o) => o.type === ActionType.ADD_LABEL)
  @ValidateNested()
  @Type(() => AddLabelActionDto)
  addLabelAction?: AddLabelActionDto

  @ValidateIf((o) => o.type === ActionType.NOTIFY_USER)
  @ValidateNested()
  @Type(() => NotifyUserActionDto)
  notifyUserAction?: NotifyUserActionDto
}

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  id: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsBoolean()
  enabled: boolean

  @IsObject()
  @ValidateNested()
  @Type(() => TriggerDto)
  trigger: TriggerDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions: ConditionDto[]

  @IsObject()
  @ValidateNested()
  @Type(() => ActionDto)
  action: ActionDto
}

export class CreateColumnRulesDto {
  @IsBoolean()
  enabled: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules: CreateRuleDto[]
}

export class UpdateColumnRulesDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules?: CreateRuleDto[]
}
