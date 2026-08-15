import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemberReference, presentMemberReference } from '@pyramid/domains/members/member.presenter';
import type { MemberDocument } from '@pyramid/domains/members/member.schema';
import type { LabelDocument } from '@pyramid/domains/taxonomy/label.schema';
import type { ProjectDocument } from '@pyramid/domains/projects/project.schema';
import type { PriorityLevel, WorkflowState } from '@pyramid/shared/domain/workflow';
import type { ChecklistItem, TaskDocument } from './task.schema';

export class ProjectReference {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
}

export class ChecklistItemView {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ example: 'Medium' }) priority: PriorityLevel;
  @ApiPropertyOptional({ type: MemberReference, nullable: true }) assignee: MemberReference | null;
  @ApiPropertyOptional({ example: '15 Aug 2026', nullable: true }) dueDate: string | null;
  @ApiProperty() completed: boolean;
}

export class TaskView {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Write API documentation' }) title: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ example: 'To Do' }) state: WorkflowState;
  @ApiProperty({ example: 'Urgent' }) priority: PriorityLevel;
  @ApiPropertyOptional({ type: MemberReference, nullable: true }) assignee: MemberReference | null;
  @ApiPropertyOptional({ type: MemberReference, nullable: true }) reporter: MemberReference | null;
  @ApiPropertyOptional({ type: ProjectReference, nullable: true }) project: ProjectReference | null;
  @ApiProperty({ type: [String], example: ['Design', 'UI/UX'] }) labels: string[];
  @ApiPropertyOptional({ example: '1 Aug 2026', nullable: true }) startDate: string | null;
  @ApiPropertyOptional({ example: '29 Jul 2026', nullable: true }) dueDate: string | null;
  @ApiProperty({ type: [ChecklistItemView] }) checklist: ChecklistItemView[];
  @ApiProperty({ example: 2000 }) boardOrder: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

function isPopulatedMember(value: unknown): value is MemberDocument {
  return typeof value === 'object' && value !== null && 'displayName' in value;
}

function isPopulatedLabel(value: unknown): value is LabelDocument {
  return typeof value === 'object' && value !== null && 'slug' in value;
}

function isPopulatedProject(value: unknown): value is ProjectDocument {
  return typeof value === 'object' && value !== null && 'title' in value;
}

function presentChecklistItem(item: ChecklistItem): ChecklistItemView {
  return {
    id: String(item._id),
    title: item.title,
    priority: item.priority,
    assignee: isPopulatedMember(item.assignee) ? presentMemberReference(item.assignee) : null,
    dueDate: item.dueDate ?? null,
    completed: item.completedAt !== null && item.completedAt !== undefined,
  };
}

/**
 * Flattens the populated document into the shape the UI consumes.
 *
 * Note `labels` collapses to a plain array of names rather than exposing the
 * reference documents. How labels are stored is a server concern; keeping it
 * behind the presenter lets the components stay declarative and spares every
 * caller from reshaping the payload.
 */
export function presentTask(document: TaskDocument): TaskView {
  return {
    id: String(document._id),
    title: document.title,
    description: document.description ?? null,
    state: document.state,
    priority: document.priority,
    assignee: isPopulatedMember(document.assignee) ? presentMemberReference(document.assignee) : null,
    reporter: isPopulatedMember(document.reporter) ? presentMemberReference(document.reporter) : null,
    project: isPopulatedProject(document.project)
      ? { id: String(document.project._id), title: document.project.title }
      : null,
    // `labels` is declared as ObjectId[]; after `.populate()` the same field
    // holds label documents. Widening before the guard is what lets the
    // presenter cope with both a populated and an unpopulated read.
    labels: ((document.labels ?? []) as unknown[]).filter(isPopulatedLabel).map((label) => label.name),
    startDate: document.startDate ?? null,
    dueDate: document.dueDate ?? null,
    checklist: (document.checklist ?? []).map(presentChecklistItem),
    boardOrder: document.boardOrder,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

/** Populate paths every task read needs to produce a complete {@link TaskView}. */
export const TASK_POPULATE_PATHS = ['assignee', 'reporter', 'project', 'labels', 'checklist.assignee'] as const;
