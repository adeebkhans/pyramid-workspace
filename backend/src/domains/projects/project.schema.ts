import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, type HydratedDocument } from 'mongoose';

import { DEFAULT_PRIORITY_LEVEL, PRIORITY_LEVELS, type PriorityLevel } from '@pyramid/shared/domain/workflow';
import { COLLECTION, MODEL, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ ...baseSchemaOptions, collection: COLLECTION.projects })
export class Project {
  @Prop({ required: true, trim: true, maxlength: 140 })
  title: string;

  @Prop({ type: String, trim: true, maxlength: 2_000, default: null })
  summary: string | null;

  @Prop({ type: String, enum: PRIORITY_LEVELS, default: DEFAULT_PRIORITY_LEVEL, index: true })
  priority: PriorityLevel;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, default: null, index: true })
  lead: Types.ObjectId | null;

  /** Display-formatted (`"12 Sep 2026"`); see `shared/utils/calendar`. */
  @Prop({ type: String, default: null })
  dueDate: string | null;

  /**
   * Soft delete. Archived projects disappear from the workspace but their tasks
   * and history survive, which is what people actually expect from a "delete"
   * button they may have pressed by accident.
   */
  @Prop({ type: Date, default: null, index: true })
  archivedAt: Date | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

ProjectSchema.index({ archivedAt: 1, createdAt: -1 });
ProjectSchema.index({ title: 'text' });
