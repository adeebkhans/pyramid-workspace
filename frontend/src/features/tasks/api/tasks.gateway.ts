import type { ActivityEntry, Comment, Task } from '@/shared/domain/models';
import type { PriorityLevel, WorkflowState } from '@/shared/domain/workflow';
import { apiClient } from '@/shared/lib/http/api-client';

/**
 * Everything the task screens know about the network.
 *
 * Components call these functions; none of them contains a URL. When the API
 * renames a route or adds a query parameter, this file changes and nothing
 * else does.
 */

export interface TaskFilters {
  search?: string;
  state?: WorkflowState[];
  priority?: PriorityLevel[];
  projectId?: string;
  assigneeId?: string;
  labels?: string[];
}

export interface TaskDraft {
  title: string;
  description?: string;
  state?: WorkflowState;
  priority?: PriorityLevel;
  projectId?: string | null;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  labels?: string[];
}

export type TaskPatch = Partial<TaskDraft>;

export const tasksGateway = {
  list: (filters: TaskFilters = {}, signal?: AbortSignal) =>
    apiClient.list<Task>(
      '/tasks',
      {
        search: filters.search,
        state: filters.state,
        priority: filters.priority,
        projectId: filters.projectId,
        assigneeId: filters.assigneeId,
        labels: filters.labels,
        pageSize: 200,
      },
      signal,
    ),

  get: (taskId: string, signal?: AbortSignal) => apiClient.get<Task>(`/tasks/${taskId}`, undefined, signal),

  create: (draft: TaskDraft, actorId?: string | null) =>
    apiClient.post<Task>('/tasks', draft, actorId ? { actorId } : undefined),

  update: (taskId: string, patch: TaskPatch, actorId?: string | null) =>
    apiClient.patch<Task>(`/tasks/${taskId}`, patch, actorId ? { actorId } : undefined),

  archive: (taskId: string, actorId?: string | null) =>
    apiClient.remove<void>(`/tasks/${taskId}`, actorId ? { actorId } : undefined),

  /**
   * Persists a drag by declaring the destination column's complete order.
   * Idempotent, so a retry after a flaky connection is harmless.
   */
  placeOnBoard: (state: WorkflowState, orderedIds: string[], actorId?: string | null) =>
    apiClient.put<void>('/tasks/board/placement', { state, orderedIds }, actorId ? { actorId } : undefined),

  addChecklistItem: (
    taskId: string,
    item: { title: string; priority?: PriorityLevel; dueDate?: string; assigneeId?: string },
    actorId?: string | null,
  ) => apiClient.post<Task>(`/tasks/${taskId}/checklist`, item, actorId ? { actorId } : undefined),

  toggleChecklistItem: (taskId: string, itemId: string, completed: boolean, actorId?: string | null) =>
    apiClient.patch<Task>(`/tasks/${taskId}/checklist/${itemId}`, { completed }, actorId ? { actorId } : undefined),

  removeChecklistItem: (taskId: string, itemId: string, actorId?: string | null) =>
    apiClient.remove<Task>(`/tasks/${taskId}/checklist/${itemId}`, actorId ? { actorId } : undefined),
};

export const commentsGateway = {
  thread: (taskId: string, signal?: AbortSignal) => apiClient.get<Comment[]>('/comments', { taskId }, signal),

  post: (input: { body: string; taskId: string; authorId: string; parentId?: string }) =>
    apiClient.post<Comment>('/comments', input),

  edit: (commentId: string, body: string) => apiClient.patch<Comment>(`/comments/${commentId}`, { body }),

  remove: (commentId: string) => apiClient.remove<void>(`/comments/${commentId}`),
};

export const activityGateway = {
  forTask: (taskId: string, signal?: AbortSignal) =>
    apiClient.get<ActivityEntry[]>('/activity', { taskId, limit: 20 }, signal),
};
