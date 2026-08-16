import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, type HydratedDocument } from 'mongoose';

import { COLLECTION, MODEL, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

export type CommentDocument = HydratedDocument<Comment>;

/**
 * Comments live in their own collection rather than embedded in the task.
 *
 * Unlike checklist items they are unbounded — a lively task can accumulate
 * hundreds — and embedding would grow the task document on every read. A
 * separate collection with an index on `task` keeps task loads flat.
 */
@Schema({ ...baseSchemaOptions, collection: COLLECTION.comments })
export class Comment {
  @Prop({ required: true, trim: true, maxlength: 4_000 })
  body: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.task, required: true, index: true })
  task: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, required: true })
  author: Types.ObjectId;

  /**
   * One level of threading, matching the "Leave a reply…" field the design
   * places under each comment. Depth is capped at one deliberately: deeper
   * trees are a rendering problem the mock does not solve.
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.comment, default: null, index: true })
  parent: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  editedAt: Date | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

/** The only read pattern: a task's thread in posting order. */
CommentSchema.index({ task: 1, createdAt: 1 });
