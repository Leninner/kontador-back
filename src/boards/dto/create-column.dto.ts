import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsArray,
  IsEnum,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CreateRuleDto } from './create-column-rules.dto'
import { ActionType, ConditionType, TriggerType } from './column-rule-types'

export class ConfigDto {
  // Config can have any properties
  [key: string]: any
}

export class TriggerDto {
  @IsEnum(TriggerType)
  type: TriggerType

  @IsObject()
  @IsOptional()
  config: ConfigDto
}

export class ConditionDto {
  @IsEnum(ConditionType)
  type: ConditionType

  @IsObject()
  @IsOptional()
  config: ConfigDto
}

export class ActionDto {
  @IsEnum(ActionType)
  type: ActionType

  @IsObject()
  @IsOptional()
  config: ConfigDto
}

export class RulesDto {
  @IsBoolean()
  enabled: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRuleDto)
  rules: CreateRuleDto[]
}

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number

  @IsUUID()
  boardId: string

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RulesDto)
  rules?: RulesDto

  @IsString()
  @IsOptional()
  color?: string
}
