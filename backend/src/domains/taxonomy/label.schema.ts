import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { COLLECTION, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

export type LabelDocument = HydratedDocument<Label>;

/**
 * Labels live in their own collection and tasks reference them by id.
 *
 * A task simply carries an array of label ids, so there is no association
 * collection to keep in step, while the label itself stays a first-class record
 * that can be renamed or described in one place and have the change appear
 * everywhere it is used.
 */
@Schema({ ...baseSchemaOptions, collection: COLLECTION.labels })
export class Label {
  @Prop({ required: true, trim: true, maxlength: 40, unique: true })
  name: string;

  /** Normalised lookup key so "Design" and "design" cannot both be created. */
  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, trim: true, maxlength: 160, default: null })
  description: string | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const LabelSchema = SchemaFactory.createForClass(Label);

export function toLabelSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
