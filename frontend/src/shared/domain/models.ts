import type { PriorityLevel, WorkflowState } from './workflow';

/**
 * The resource shapes the API returns. These match the server-side presenters
 * one-for-one, so nothing in the component tree has to reshape a payload.
 */

export interface MemberReference {
  id: string;
  name: string;
  avatarUrl: string;
  initials: string;
}

export interface Member extends MemberReference {
  email: string;
  jobTitle: string | null;
  isGuest: boolean;
}

export interface ProjectReference {
  id: string;
  title: string;
}

export interface ProjectProgress {
  total: number;
  completed: number;
  percentComplete: number;
}

export interface Project extends ProjectReference {
  summary: string | null;
  priority: PriorityLevel;
  lead: MemberReference | null;
  dueDate: string | null;
  progress?: ProjectProgress;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  priority: PriorityLevel;
  assignee: MemberReference | null;
  dueDate: string | null;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  state: WorkflowState;
  priority: PriorityLevel;
  assignee: MemberReference | null;
  reporter: MemberReference | null;
  project: ProjectReference | null;
  labels: string[];
  startDate: string | null;
  dueDate: string | null;
  checklist: ChecklistItem[];
  boardOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  body: string;
  author: MemberReference | null;
  postedAt: string;
  editedAt: string | null;
  replies: Comment[];
}

export interface ActivityEntry {
  id: string;
  verb: string;
  actor: MemberReference | null;
  payload: Record<string, unknown>;
  summary: string;
  occurredAt: string;
}

export interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

/** Envelope returned by every list endpoint. */
export interface Collection<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNextPage: boolean;
  };
}
