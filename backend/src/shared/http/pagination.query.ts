import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;

/**
 * Base class for every list endpoint's query string. Concrete queries extend it
 * with their own filters, which keeps paging semantics identical everywhere.
 */
export class PaginationQuery {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Case-insensitive substring match against the resource title' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
}

/** Escapes user input before it becomes part of a `$regex` filter. */
export function toSafeRegex(term: string): RegExp {
  return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}
