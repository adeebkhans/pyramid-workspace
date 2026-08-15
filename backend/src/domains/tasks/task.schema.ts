import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, type HydratedDocument } from 'mongoose';

import {
  DEFAULT_PRIORITY_LEVEL,
  DEFAULT_WORKFLOW_STATE,
  PRIORITY_LEVELS,
  WORKFLOW_STATES,
  type PriorityLevel,
  type WorkflowState,
} from '@pyramid/shared/domain/workflow';
import { COLLECTION, MODEL, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

/**
 * Checklist items are embedded rather than stored in their own collection.
 *
 * They are only ever read through their parent task, they are few, and they
 * are deleted with it — exactly the shape MongoDB's embedding guidance points
 * at. A task therefore arrives complete in a single document, with no second
 * query and no join to assemble its checklist.
 */
@Schema({ _id: true, timestamps: true, versionKey: false })
export class ChecklistItem {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, enum: PRIORITY_LEVELS, default: DEFAULT_PRIORITY_LEVEL })
  priority: PriorityLevel;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, default: null })
  assignee: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  dueDate: string | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  readonly createdAt: Date;
}

export const ChecklistItemSchema = SchemaFactory.createForClass(ChecklistItem);

export type TaskDocument = HydratedDocument<Task>;

@Schema({ ...baseSchemaOptions, collection: COLLECTION.tasks })
export class Task {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, trim: true, maxlength: 5_000, default: null })
  description: string | null;

  @Prop({ type: String, enum: WORKFLOW_STATES, default: DEFAULT_WORKFLOW_STATE, index: true })
  state: WorkflowState;

  @Prop({ type: String, enum: PRIORITY_LEVELS, default: DEFAULT_PRIORITY_LEVEL, index: true })
  priority: PriorityLevel;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, default: null, index: true })
  assignee: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, default: null })
  reporter: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.project, default: null, index: true })
  project: Types.ObjectId | null;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: MODEL.label }], default: [] })
  labels: Types.ObjectId[];

  @Prop({ type: String, default: null })
  startDate: string | null;

  @Prop({ type: String, default: null })
  dueDate: string | null;

  @Prop({ type: [ChecklistItemSchema], default: [] })
  checklist: ChecklistItem[];

  /**
   * Manual ordering within a board column. Sparse gaps (1000, 2000, 3000…) let
   * a card be dropped between two neighbours by taking the midpoint, so a
   * reorder writes one document instead of renumbering the whole column.
   */
  @Prop({ type: Number, default: 0, index: true })
  boardOrder: number;

  @Prop({ type: Date, default: null, index: true })
  archivedAt: Date | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

/** Board reads: "everything in this column, in manual order". */
TaskSchema.index({ archivedAt: 1, state: 1, boardOrder: 1 });

/** Project detail reads. */
TaskSchema.index({ project: 1, archivedAt: 1 });

/** Free-text search from the list-view search box. */
TaskSchema.index({ title: 'text', description: 'text' });

export const BOARD_ORDER_STEP = 1_000;
