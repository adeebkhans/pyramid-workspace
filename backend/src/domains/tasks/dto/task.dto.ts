import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import {
  PRIORITY_LEVELS,
  WORKFLOW_STATES,
  type PriorityLevel,
  type WorkflowState,
} from '@pyramid/shared/domain/workflow';
import { PaginationQuery } from '@pyramid/shared/http/pagination.query';
import { IsValidDateRange } from '@pyramid/shared/validation/date-range.validator';
import { IsDisplayDate } from '@pyramid/shared/validation/display-date.validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const asBoolean = ({ value }: { value: unknown }) => value === true || value === 'true';
const asCsv = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').map((entry) => entry.trim()).filter(Boolean) : value;

export class CreateTaskDto {
  @ApiProperty({ example: 'Write API documentation' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  @Transform(trim)
  description?: string;

  @ApiPropertyOptional({ enum: WORKFLOW_STATES, default: 'Backlog' })
  @IsOptional()
  @IsIn([...WORKFLOW_STATES])
  state?: WorkflowState;

  @ApiPropertyOptional({ enum: PRIORITY_LEVELS, default: 'No Priority' })
  @IsOptional()
  @IsIn([...PRIORITY_LEVELS])
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: 'Member id' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsMongoId()
  assigneeId?: string | null;

  @ApiPropertyOptional({ description: 'Member id of whoever filed the task' })
  @IsOptional()
  @IsMongoId()
  reporterId?: string;

  @ApiPropertyOptional({ description: 'Project id' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsMongoId()
  projectId?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['Design'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({ example: '1 Aug 2026' })
  @IsOptional()
  @IsDisplayDate()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '29 Jul 2026' })
  @IsOptional()
  @IsDisplayDate()
  @IsValidDateRange()
  dueDate?: string | null;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class TaskQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: WORKFLOW_STATES, isArray: true })
  @IsOptional()
  @Transform(asCsv)
  @IsArray()
  @IsIn([...WORKFLOW_STATES], { each: true })
  state?: WorkflowState[];

  @ApiPropertyOptional({ enum: PRIORITY_LEVELS, isArray: true })
  @IsOptional()
  @Transform(asCsv)
  @IsArray()
  @IsIn([...PRIORITY_LEVELS], { each: true })
  priority?: PriorityLevel[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Label slugs or names' })
  @IsOptional()
  @Transform(asCsv)
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(asBoolean)
  @IsBoolean()
  includeArchived?: boolean;
}

/**
 * Body of `PUT /tasks/board/placement`.
 *
 * The client sends the column it dropped into plus that column's full order
 * after the drop. Declaring the desired end state — instead of "move item X up
 * by one" — makes the endpoint idempotent and immune to races between two
 * people dragging at once.
 */
export class PlaceOnBoardDto {
  @ApiProperty({ enum: WORKFLOW_STATES })
  @IsIn([...WORKFLOW_STATES])
  state: WorkflowState;

  @ApiProperty({ type: [String], description: 'Task ids, top to bottom, for the destination column' })
  @IsArray()
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  orderedIds: string[];
}

export class AddChecklistItemDto {
  @ApiProperty({ example: 'Research competitors' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  title: string;

  @ApiPropertyOptional({ enum: PRIORITY_LEVELS })
  @IsOptional()
  @IsIn([...PRIORITY_LEVELS])
  priority?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '12 Aug 2026' })
  @IsOptional()
  @IsDisplayDate()
  dueDate?: string;
}

export class UpdateChecklistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  title?: string;

  @ApiPropertyOptional({ enum: PRIORITY_LEVELS })
  @IsOptional()
  @IsIn([...PRIORITY_LEVELS])
  priority?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(asBoolean)
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDisplayDate()
  dueDate?: string | null;
}

/** Optional actor id so the activity stream can attribute a change. */
export class ActorQuery {
  @ApiPropertyOptional({ description: 'Member id performing the action' })
  @IsOptional()
  @IsMongoId()
  actorId?: string;
}

export class BoardOrderSeed {
  @IsOptional()
  @IsInt()
  @Min(0)
  boardOrder?: number;
}
