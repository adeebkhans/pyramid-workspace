import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { ActivityVerb } from '@pyramid/shared/domain/activity-verbs';
import { MemberReference, presentMemberReference } from '@pyramid/domains/members/member.presenter';
import type { MemberDocument } from '@pyramid/domains/members/member.schema';
import type { ActivityDocument } from './activity.schema';

export class ActivityView {
  @ApiProperty() id: string;

  @ApiProperty({ example: 'task.priority-changed' })
  verb: ActivityVerb;

  @ApiPropertyOptional({ type: MemberReference, nullable: true })
  actor: MemberReference | null;

  @ApiProperty({ example: { from: 'Low', to: 'Urgent' } })
  payload: Record<string, unknown>;

  @ApiProperty({ example: 'changed priority from Low to Urgent' })
  summary: string;

  @ApiProperty({ example: '2026-08-10T09:31:00.000Z' })
  occurredAt: string;
}

/**
 * Renders the verb + payload into an English fragment. Doing it server-side
 * keeps a growing switch statement out of the React tree, and means any future
 * client (a digest email, a Slack hook) gets the same wording for free.
 */
export function describeActivity(verb: ActivityVerb, payload: Record<string, unknown>): string {
  const from = payload.from === undefined || payload.from === null || payload.from === '' ? 'nothing' : String(payload.from);
  const to = payload.to === undefined || payload.to === null || payload.to === '' ? 'nothing' : String(payload.to);

  switch (verb) {
    case 'task.created':
      return 'created this task';
    case 'task.renamed':
      return `renamed the task to "${to}"`;
    case 'task.described':
      return 'updated the description';
    case 'task.state-changed':
      return `moved this task from ${from} to ${to}`;
    case 'task.priority-changed':
      return `changed priority from ${from} to ${to}`;
    case 'task.assignee-changed':
      return payload.to ? `assigned this task to ${to}` : 'removed the assignee';
    case 'task.due-date-changed':
      return payload.to ? `set the due date to ${to}` : 'cleared the due date';
    case 'task.labels-changed':
      return `updated labels to ${to}`;
    case 'task.archived':
      return 'archived this task';
    case 'checklist.item-added':
      return `added the subtask "${to}"`;
    case 'checklist.item-completed':
      return `completed the subtask "${to}"`;
    case 'checklist.item-removed':
      return `removed the subtask "${from}"`;
    case 'comment.posted':
      return 'left a comment';
    case 'comment.edited':
      return 'edited a comment';
    case 'comment.removed':
      return 'deleted a comment';
    default:
      return 'updated this task';
  }
}

export function presentActivity(document: ActivityDocument): ActivityView {
  const actor = document.actor && typeof document.actor === 'object' && 'displayName' in document.actor
    ? presentMemberReference(document.actor as unknown as MemberDocument)
    : null;

  const payload = document.payload ?? {};

  return {
    id: String(document._id),
    verb: document.verb,
    actor,
    payload,
    summary: describeActivity(document.verb, payload),
    occurredAt: document.createdAt.toISOString(),
  };
}
