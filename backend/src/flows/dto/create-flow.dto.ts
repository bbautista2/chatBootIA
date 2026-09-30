import { IsString, IsOptional, IsBoolean, IsInt, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTriggerDto {
  @IsEnum(['keyword', 'first_message', 'comment', 'postback'] as const)
  type: 'keyword' | 'first_message' | 'comment' | 'postback';

  @IsString()
  value: string;
}

export class CreateStepDto {
  @IsInt()
  order: number;

  @IsEnum(['text', 'image', 'buttons', 'carousel', 'handoff'] as const)
  type: 'text' | 'image' | 'buttons' | 'carousel' | 'handoff';

  @IsOptional()
  content?: any;

  @IsOptional()
  @IsString()
  nextStepId?: string;
}

export class CreateFlowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTriggerDto)
  triggers?: CreateTriggerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  steps?: CreateStepDto[];
}

export class UpdateFlowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class ReorderStepsDto {
  @IsArray()
  @IsString({ each: true })
  stepIds: string[];
}
