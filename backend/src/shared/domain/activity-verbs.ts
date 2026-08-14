/**
 * Every mutation worth remembering is described by one of these verbs. The
 * activity stream stores the verb plus a small payload, which lets the UI
 * render a human sentence without the writer having to know how it reads.
 */
export const ACTIVITY_VERBS = [
  'task.created',
  'task.renamed',
  'task.described',
  'task.state-changed',
  'task.priority-changed',
  'task.assignee-changed',
  'task.due-date-changed',
  'task.labels-changed',
  'task.archived',
  'checklist.item-added',
  'checklist.item-completed',
  'checklist.item-removed',
  'comment.posted',
  'comment.edited',
  'comment.removed',
] as const;

export type ActivityVerb = (typeof ACTIVITY_VERBS)[number];

export const ACTIVITY_EVENT_CHANNEL = 'activity.recorded';

export interface ActivityDraft {
  verb: ActivityVerb;
  taskId?: string;
  projectId?: string;
  actorId?: string | null;
  /** Free-form, verb-specific detail: `{ from: 'Low', to: 'Urgent' }`. */
  payload?: Record<string, unknown>;
}
