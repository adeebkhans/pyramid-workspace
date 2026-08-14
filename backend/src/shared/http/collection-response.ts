import { ApiProperty } from '@nestjs/swagger';

/**
 * Every list endpoint answers with the same envelope: the page of records under
 * `data`, and the paging arithmetic under `meta`. Single-resource endpoints
 * return the resource bare — an envelope there would be ceremony without value.
 */
export class CollectionMeta {
  @ApiProperty({ example: 42, description: 'Total documents matching the filter, ignoring pagination' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  pageSize: number;

  @ApiProperty({ example: 1 })
  pageCount: number;

  @ApiProperty({ example: false })
  hasNextPage: boolean;
}

export class CollectionResponse<T> {
  data: T[];
  meta: CollectionMeta;
}

export function buildCollection<T>(data: T[], total: number, page: number, pageSize: number): CollectionResponse<T> {
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      pageCount,
      hasNextPage: page < pageCount,
    },
  };
}
