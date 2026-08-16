import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Types } from 'mongoose';

import type { Member, MemberDocument } from './member.schema';

/**
 * The wire shape of a member.
 *
 * Presenters exist so the persistence model can evolve (rename `displayName`,
 * add a `lastSeenAt`) without silently reshaping the public API. Nothing is
 * serialised to a client except through one of these.
 */
export class MemberView {
  @ApiProperty({ example: '66f1c0f2a5f1b2c3d4e5f6a7' })
  id: string;

  @ApiProperty({ example: 'Amber Falcon' })
  name: string;

  @ApiProperty({ example: 'amber.falcon@guest.pyramid.app' })
  email: string;

  @ApiProperty({ example: 'https://api.dicebear.com/9.x/notionists/svg?seed=amber' })
  avatarUrl: string;

  @ApiProperty({ example: 'AF' })
  initials: string;

  @ApiPropertyOptional({ example: 'Product Designer', nullable: true })
  jobTitle: string | null;

  @ApiProperty({ example: true, description: 'True when the member arrived through guest sign-in' })
  isGuest: boolean;
}

type MemberLike = (Member & { _id: Types.ObjectId }) | MemberDocument;

export function presentMember(document: MemberLike): MemberView {
  return {
    id: String(document._id),
    name: document.displayName,
    email: document.email,
    avatarUrl: document.avatarUrl,
    initials: document.initials,
    jobTitle: document.jobTitle ?? null,
    isGuest: document.origin === 'guest',
  };
}

/**
 * Reference-shaped projection embedded inside tasks, projects and comments.
 * Deliberately smaller than {@link MemberView}: a task card has no business
 * knowing a member's email address.
 */
export class MemberReference {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() avatarUrl: string;
  @ApiProperty() initials: string;
}

export function presentMemberReference(document: MemberLike | null | undefined): MemberReference | null {
  if (!document) return null;

  return {
    id: String(document._id),
    name: document.displayName,
    avatarUrl: document.avatarUrl,
    initials: document.initials,
  };
}
