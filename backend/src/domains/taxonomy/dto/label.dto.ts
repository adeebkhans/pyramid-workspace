import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PaginationQuery } from '@pyramid/shared/http/pagination.query';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateLabelDto {
  @ApiProperty({ example: 'Design' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(trim)
  name: string;

  @ApiPropertyOptional({ example: 'Anything owned by the design guild' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(trim)
  description?: string;
}

/** Body of `PUT /tasks/:id/labels` — the full desired label set, by name. */
export class ReplaceLabelsDto {
  @ApiProperty({ type: [String], example: ['Design', 'UI/UX'] })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  names: string[];
}

export class LabelQuery extends PaginationQuery {}
