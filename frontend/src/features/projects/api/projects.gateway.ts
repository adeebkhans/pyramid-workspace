import type { Project } from '@/shared/domain/models';
import type { PriorityLevel } from '@/shared/domain/workflow';
import { apiClient } from '@/shared/lib/http/api-client';

export interface ProjectDraft {
  title: string;
  summary?: string;
  priority?: PriorityLevel;
  leadId?: string;
  dueDate?: string;
}

export interface ProjectFilters {
  search?: string;
  priority?: PriorityLevel[];
  leadId?: string;
}

export const projectsGateway = {
  /**
   * `withProgress` costs one extra aggregation server-side, so it is opt-in —
   * the list asks for it, the composer's optimistic insert does not.
   */
  list: (filters: ProjectFilters = {}, signal?: AbortSignal) =>
    apiClient.list<Project>(
      '/projects',
      { search: filters.search, priority: filters.priority, leadId: filters.leadId, withProgress: true, pageSize: 100 },
      signal,
    ),

  get: (projectId: string, signal?: AbortSignal) =>
    apiClient.get<Project>(`/projects/${projectId}`, undefined, signal),

  create: (draft: ProjectDraft) => apiClient.post<Project>('/projects', draft),

  update: (projectId: string, changes: Partial<ProjectDraft>) =>
    apiClient.patch<Project>(`/projects/${projectId}`, changes),

  archive: (projectId: string) => apiClient.remove<void>(`/projects/${projectId}`),
};
