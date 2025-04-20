import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ActionType, ConditionType, TriggerType } from './column-rule-types'

export class TriggerDto {
  @IsEnum(TriggerType)
  type: TriggerType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>
}

export class ConditionDto {
  @IsEnum(ConditionType)
  type: ConditionType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>
}

export class ActionDto {
  @IsEnum(ActionType)
  type: ActionType

  @IsObject()
  @IsOptional()
  config?: Record<string, any>
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
