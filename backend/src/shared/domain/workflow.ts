/**
 * The vocabulary the whole system speaks. Schemas, DTOs, validators, presenters
 * and the seeder all import from here so a new column or priority tier can
 * never drift between the database and the wire contract.
 */

export const WORKFLOW_STATES = ['Backlog', 'To Do', 'Doing', 'On Hold', 'Completed'] as const;
export type WorkflowState = (typeof WORKFLOW_STATES)[number];

export const PRIORITY_LEVELS = ['Urgent', 'High', 'Medium', 'Low', 'No Priority'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const DEFAULT_WORKFLOW_STATE: WorkflowState = 'Backlog';
export const DEFAULT_PRIORITY_LEVEL: PriorityLevel = 'No Priority';

export const TERMINAL_WORKFLOW_STATES: ReadonlySet<WorkflowState> = new Set<WorkflowState>(['Completed']);
