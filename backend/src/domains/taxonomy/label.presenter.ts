import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Types } from 'mongoose';

import type { Label, LabelDocument } from './label.schema';

export class LabelView {
  @ApiProperty({ example: '66f1c0f2a5f1b2c3d4e5f6a7' })
  id: string;

  @ApiProperty({ example: 'Design' })
  name: string;

  @ApiProperty({ example: 'design' })
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;
}

type LabelLike = LabelDocument | (Label & { _id: Types.ObjectId });

export function presentLabel(document: LabelLike): LabelView {
  return {
    id: String(document._id),
    name: document.name,
    slug: document.slug,
    description: document.description ?? null,
  };
}
