import { ApiPropertyOptional, ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PaginationQuery } from '@pyramid/shared/http/pagination.query';
import { PRIORITY_LEVELS, type PriorityLevel } from '@pyramid/shared/domain/workflow';
import { IsDisplayDate } from '@pyramid/shared/validation/display-date.validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateProjectDto {
  @ApiProperty({ example: 'Design Homepage' })
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  @Transform(trim)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  @Transform(trim)
  summary?: string;

  @ApiPropertyOptional({ enum: PRIORITY_LEVELS, default: 'No Priority' })
  @IsOptional()
  @IsIn([...PRIORITY_LEVELS])
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: 'Member id of the project lead' })
  @IsOptional()
  @IsMongoId()
  leadId?: string;

  @ApiPropertyOptional({ example: '12 Sep 2026' })
  @IsOptional()
  @IsDisplayDate()
  dueDate?: string;
}

/**
 * `PartialType` keeps the update contract in lockstep with creation: a new
 * field only has to be declared once.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: PRIORITY_LEVELS })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn([...PRIORITY_LEVELS])
  priority?: PriorityLevel;

  @ApiPropertyOptional({ description: 'Filter to projects led by this member' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsMongoId()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Include archived projects in the result', default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  includeArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Attach per-project task counts. Costs one extra aggregation.',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  withProgress?: boolean;
}
