import type { SchemaOptions } from 'mongoose';

/**
 * Shared schema options applied to every collection.
 *
 * Two decisions worth calling out:
 *  • `_id` is rewritten to `id` and `__v` is dropped on serialisation, so the
 *    HTTP contract never exposes driver internals.
 *  • `timestamps` gives every document `createdAt` / `updatedAt` for free,
 *    which the activity stream and "recently updated" sorts rely on.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  minimize: false,
  toJSON: {
    virtuals: true,
    transform: (_document, record: Record<string, unknown>) => {
      record.id = String(record._id);
      delete record._id;
      return record;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_document, record: Record<string, unknown>) => {
      record.id = String(record._id);
      delete record._id;
      return record;
    },
  },
};

/**
 * Reference fields must be declared with `SchemaTypes.ObjectId`, never
 * `Types.ObjectId`.
 *
 * The two look interchangeable — `Types.ObjectId` is the BSON *value* class,
 * `SchemaTypes.ObjectId` is the schema *type*. Passing the value class makes
 * Mongoose fall back to `Mixed`, which still stores ids correctly but silently
 * stops casting them on the way in: `find({ task: '<hex string>' })` then
 * matches nothing. Declare the property's TypeScript type as `Types.ObjectId`
 * and its `@Prop({ type })` as `SchemaTypes.ObjectId`.
 */

/** Collection names kept in one place so a rename cannot desync a `ref`. */
export const COLLECTION = {
  members: 'members',
  projects: 'projects',
  tasks: 'tasks',
  labels: 'labels',
  comments: 'comments',
  activities: 'activities',
} as const;

/** Model tokens used by `@InjectModel` and `MongooseModule.forFeature`. */
export const MODEL = {
  member: 'Member',
  project: 'Project',
  task: 'Task',
  label: 'Label',
  comment: 'Comment',
  activity: 'Activity',
} as const;
