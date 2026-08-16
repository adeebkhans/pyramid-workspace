import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemberReference, presentMemberReference } from '@pyramid/domains/members/member.presenter';
import type { MemberDocument } from '@pyramid/domains/members/member.schema';
import type { CommentDocument } from './comment.schema';

export class CommentView {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Looks good — shipping tomorrow.' }) body: string;
  @ApiPropertyOptional({ type: MemberReference, nullable: true }) author: MemberReference | null;
  @ApiProperty({ example: '2026-08-10T09:31:00.000Z' }) postedAt: string;
  @ApiPropertyOptional({ nullable: true }) editedAt: string | null;
  @ApiProperty({ type: [CommentView] }) replies: CommentView[];
}

function isPopulatedMember(value: unknown): value is MemberDocument {
  return typeof value === 'object' && value !== null && 'displayName' in value;
}

function presentOne(document: CommentDocument, replies: CommentView[] = []): CommentView {
  return {
    id: String(document._id),
    body: document.body,
    author: isPopulatedMember(document.author) ? presentMemberReference(document.author) : null,
    postedAt: document.createdAt.toISOString(),
    editedAt: document.editedAt ? document.editedAt.toISOString() : null,
    replies,
  };
}

/**
 * Assembles a flat query result into the one-level thread the UI renders.
 *
 * Fetching the whole task's comments in a single query and grouping in memory
 * avoids the N+1 that a per-comment "load replies" call would cause.
 */
export function presentThread(documents: CommentDocument[]): CommentView[] {
  const repliesByParent = new Map<string, CommentDocument[]>();
  const roots: CommentDocument[] = [];

  for (const document of documents) {
    if (document.parent) {
      const key = String(document.parent);
      const bucket = repliesByParent.get(key);
      if (bucket) bucket.push(document);
      else repliesByParent.set(key, [document]);
    } else {
      roots.push(document);
    }
  }

  return roots.map((root) =>
    presentOne(
      root,
      (repliesByParent.get(String(root._id)) ?? []).map((reply) => presentOne(reply)),
    ),
  );
}

export function presentComment(document: CommentDocument): CommentView {
  return presentOne(document);
}
