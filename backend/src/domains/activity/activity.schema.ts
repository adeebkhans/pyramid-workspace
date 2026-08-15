import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, type HydratedDocument } from 'mongoose';

import { ACTIVITY_VERBS, type ActivityVerb } from '@pyramid/shared/domain/activity-verbs';
import { COLLECTION, MODEL, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

export type ActivityDocument = HydratedDocument<Activity>;

/**
 * An append-only record of what happened to a task.
 *
 * It backs the "Updates" panel on the task detail screen and doubles as a
 * lightweight audit log — the sort of thing that becomes mandatory the moment a
 * workspace has more than one person in it.
 */
@Schema({ ...baseSchemaOptions, collection: COLLECTION.activities })
export class Activity {
  @Prop({ type: String, enum: ACTIVITY_VERBS, required: true, index: true })
  verb: ActivityVerb;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.task, default: null, index: true })
  task: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.project, default: null, index: true })
  project: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: MODEL.member, default: null })
  actor: Types.ObjectId | null;

  /** Verb-specific detail, e.g. `{ from: 'Low', to: 'Urgent' }`. */
  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

/** The only read pattern that matters: newest-first for one task. */
ActivitySchema.index({ task: 1, createdAt: -1 });

/**
 * Activity is diagnostic, not business-critical, so entries expire after 180
 * days. This keeps the collection from growing without bound on a long-lived
 * deployment.
 */
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });
