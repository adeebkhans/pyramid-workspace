/**
 * Mirror of the API's domain vocabulary.
 *
 * Duplicating the enums here is deliberate: the client is a separate deployable
 * and should not import server code. Keeping them in one small file means the
 * contract is auditable at a glance if the API ever adds a state.
 */

export const WORKFLOW_STATES = ['Backlog', 'To Do', 'Doing', 'On Hold', 'Completed'] as const;
export type WorkflowState = (typeof WORKFLOW_STATES)[number];

export const PRIORITY_LEVELS = ['Urgent', 'High', 'Medium', 'Low', 'No Priority'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Columns rendered on the board, in order. Backlog is list-only by design. */
export const BOARD_COLUMNS: readonly WorkflowState[] = ['To Do', 'Doing', 'Completed', 'On Hold'];

/** Groups rendered in the list view, in order. */
export const LIST_GROUPS: readonly WorkflowState[] = ['To Do', 'Doing', 'On Hold', 'Completed', 'Backlog'];

/** Dot colour beside a state in the detail panel's status picker. */
export const STATE_DOT: Readonly<Record<WorkflowState, string>> = {
  'To Do': 'bg-neutral-400',
  Doing: 'bg-amber-500',
  Completed: 'bg-emerald-500',
  'On Hold': 'bg-red-400',
  Backlog: 'bg-neutral-300',
};

/** Label colour for the same picker. */
export const STATE_TEXT: Readonly<Record<WorkflowState, string>> = {
  'To Do': 'text-neutral-500 dark:text-neutral-400',
  Doing: 'text-amber-600 dark:text-amber-400',
  Completed: 'text-emerald-600 dark:text-emerald-400',
  'On Hold': 'text-red-500',
  Backlog: 'text-neutral-400',
};

/** How many of the three bars in the priority meter are lit. */
export const PRIORITY_BARS: Readonly<Record<PriorityLevel, number>> = {
  Urgent: 3,
  High: 3,
  Medium: 2,
  Low: 1,
  'No Priority': 0,
};

/** Text colour for the priority meter, keyed to the priority tokens. */
export const PRIORITY_TONE: Readonly<Record<PriorityLevel, string>> = {
  Urgent: 'text-priority-high',
  High: 'text-priority-high',
  Medium: 'text-priority-medium',
  Low: 'text-priority-low',
  'No Priority': 'text-neutral-400',
};
