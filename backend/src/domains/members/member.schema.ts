import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

import { COLLECTION, baseSchemaOptions } from '@pyramid/shared/persistence/schema-options';

/**
 * How a member joined the workspace. Kept explicit rather than inferred from
 * the email address, because the UI genuinely behaves differently for guests
 * (editable profile fields, "leave workspace" wording).
 */
export const MEMBERSHIP_ORIGINS = ['guest', 'federated', 'seeded'] as const;
export type MembershipOrigin = (typeof MEMBERSHIP_ORIGINS)[number];

export type MemberDocument = HydratedDocument<Member>;

@Schema({ ...baseSchemaOptions, collection: COLLECTION.members })
export class Member {
  @Prop({ required: true, trim: true, maxlength: 80 })
  displayName: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true, index: true })
  email: string;

  /** Stable, generated portrait URL — see `shared/utils/avatar.factory`. */
  @Prop({ required: true })
  avatarUrl: string;

  @Prop({ required: true, maxlength: 2 })
  initials: string;

  // Nullable fields declare `type` explicitly: the emitted design-type for a
  // `string | null` union is `Object`, which Mongoose cannot map on its own.
  @Prop({ type: String, trim: true, maxlength: 60, default: null })
  jobTitle: string | null;

  @Prop({ type: String, trim: true, lowercase: true, maxlength: 40, default: null })
  handle: string | null;

  @Prop({ type: String, enum: MEMBERSHIP_ORIGINS, default: 'federated', index: true })
  origin: MembershipOrigin;

  @Prop({ type: Date, default: () => new Date() })
  lastSeenAt: Date;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);

/** Supports the member picker's "type a name" lookup without a collection scan. */
MemberSchema.index({ displayName: 'text', email: 'text' });
