import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MemberReference, presentMemberReference } from '@pyramid/domains/members/member.presenter';
import type { MemberDocument } from '@pyramid/domains/members/member.schema';
import type { PriorityLevel } from '@pyramid/shared/domain/workflow';
import type { ProjectDocument } from './project.schema';

export class ProjectProgress {
  @ApiProperty({ example: 12 }) total: number;
  @ApiProperty({ example: 5 }) completed: number;
  @ApiProperty({ example: 42, description: 'Whole-number percentage of completed tasks' })
  percentComplete: number;
}

export class ProjectView {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'Design Homepage' }) title: string;
  @ApiPropertyOptional({ nullable: true }) summary: string | null;
  @ApiProperty({ example: 'High' }) priority: PriorityLevel;
  @ApiPropertyOptional({ type: MemberReference, nullable: true }) lead: MemberReference | null;
  @ApiPropertyOptional({ example: '12 Sep 2026', nullable: true }) dueDate: string | null;
  @ApiPropertyOptional({ type: ProjectProgress }) progress?: ProjectProgress;
  @ApiProperty() createdAt: string;
}

function isPopulatedMember(value: unknown): value is MemberDocument {
  return typeof value === 'object' && value !== null && 'displayName' in value;
}

export function presentProject(document: ProjectDocument, progress?: ProjectProgress): ProjectView {
  return {
    id: String(document._id),
    title: document.title,
    summary: document.summary ?? null,
    priority: document.priority,
    lead: isPopulatedMember(document.lead) ? presentMemberReference(document.lead) : null,
    dueDate: document.dueDate ?? null,
    ...(progress ? { progress } : {}),
    createdAt: document.createdAt.toISOString(),
  };
}

export function toProgress(total: number, completed: number): ProjectProgress {
  return {
    total,
    completed,
    percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
