import type { PriorityLevel, WorkflowState } from '@pyramid/shared/domain/workflow';
import { offsetDays } from '@pyramid/shared/utils/calendar';

/**
 * Declarative description of the demo workspace.
 *
 * Keeping the data separate from the code that writes it means the seeder is a
 * dozen lines of loops, and changing the demo content never risks changing the
 * insertion logic. Dates are relative to the day you seed, so a deployment left
 * running for a month does not fill up with dates in the past.
 */

export interface MemberBlueprint {
  key: string;
  name: string;
  email: string;
  jobTitle: string;
}

export interface ProjectBlueprint {
  key: string;
  title: string;
  summary: string;
  priority: PriorityLevel;
  leadKey: string;
  dueInDays: number;
}

export interface TaskBlueprint {
  key: string;
  title: string;
  description?: string;
  state: WorkflowState;
  priority: PriorityLevel;
  assigneeKey: string;
  projectKey: string;
  labels: string[];
  dueInDays: number;
  checklist?: { title: string; priority: PriorityLevel; assigneeKey?: string; dueInDays: number; done?: boolean }[];
  comments?: { authorKey: string; body: string; replies?: { authorKey: string; body: string }[] }[];
}

export const MEMBER_BLUEPRINTS: MemberBlueprint[] = [
  { key: 'dexter', name: 'Dexter Rowe', email: 'dexter.rowe@pyramid.app', jobTitle: 'Product Designer' },
  { key: 'priya', name: 'Priya Raman', email: 'priya.raman@pyramid.app', jobTitle: 'Engineering Lead' },
  { key: 'marco', name: 'Marco Silva', email: 'marco.silva@pyramid.app', jobTitle: 'Frontend Engineer' },
  { key: 'anais', name: 'Anais Dubois', email: 'anais.dubois@pyramid.app', jobTitle: 'QA Engineer' },
  { key: 'tomas', name: 'Tomas Reyes', email: 'tomas.reyes@pyramid.app', jobTitle: 'Platform Engineer' },
];

export const LABEL_BLUEPRINTS = ['Deployment', 'Testing', 'Design', 'UI/UX', 'Frontend', 'Backend'];

export const PROJECT_BLUEPRINTS: ProjectBlueprint[] = [
  {
    key: 'homepage',
    title: 'Design Homepage',
    summary: 'Refresh the marketing homepage around the new positioning.',
    priority: 'High',
    leadKey: 'dexter',
    dueInDays: 33,
  },
  {
    key: 'login',
    title: 'Develop Login Feature',
    summary: 'Guest access plus federated sign-in, with session persistence.',
    priority: 'Low',
    leadKey: 'priya',
    dueInDays: 36,
  },
  {
    key: 'payments',
    title: 'Test Payment Gateway',
    summary: 'End-to-end coverage for the checkout provider migration.',
    priority: 'Medium',
    leadKey: 'anais',
    dueInDays: 39,
  },
];

export const TASK_BLUEPRINTS: TaskBlueprint[] = [
  {
    key: 'api-docs',
    title: 'Write API Documentation',
    description:
      'Publish reference docs for every public endpoint, including request and response examples plus the error envelope.',
    state: 'To Do',
    priority: 'Urgent',
    assigneeKey: 'priya',
    projectKey: 'login',
    labels: ['Deployment', 'Backend'],
    dueInDays: -12,
    checklist: [
      { title: 'Research competitors', priority: 'High', assigneeKey: 'dexter', dueInDays: 2 },
      { title: 'Create wireframes', priority: 'Medium', assigneeKey: 'dexter', dueInDays: 5 },
      { title: 'Design mockups', priority: 'Low', dueInDays: 10 },
    ],
    comments: [
      {
        authorKey: 'dexter',
        body: 'Drafted the overview section — the auth flow still needs a diagram.',
        replies: [{ authorKey: 'priya', body: 'I can sketch the sequence diagram this afternoon.' }],
      },
      { authorKey: 'marco', body: 'Please include the rate-limit headers in the reference.' },
    ],
  },
  {
    key: 'search',
    title: 'Implement Search Function',
    description: 'Server-side search across task titles and descriptions, with debounce on the client.',
    state: 'To Do',
    priority: 'High',
    assigneeKey: 'marco',
    projectKey: 'login',
    labels: ['Frontend'],
    dueInDays: -12,
  },
  {
    key: 'deploy',
    title: 'Deploy to Production',
    state: 'To Do',
    priority: 'High',
    assigneeKey: 'tomas',
    projectKey: 'login',
    labels: ['Deployment'],
    dueInDays: -12,
  },
  {
    key: 'code-review',
    title: 'Code Review Completed',
    state: 'Doing',
    priority: 'Medium',
    assigneeKey: 'priya',
    projectKey: 'login',
    labels: ['Deployment'],
    dueInDays: -12,
  },
  {
    key: 'mockups',
    title: 'Design Mockups Finalized',
    description: 'Lock the desktop and mobile compositions before handoff.',
    state: 'Doing',
    priority: 'High',
    assigneeKey: 'dexter',
    projectKey: 'homepage',
    labels: ['Design', 'UI/UX'],
    dueInDays: -12,
    checklist: [
      { title: 'Desktop composition', priority: 'High', assigneeKey: 'dexter', dueInDays: -3, done: true },
      { title: 'Mobile composition', priority: 'Medium', assigneeKey: 'dexter', dueInDays: 4 },
    ],
  },
  {
    key: 'feature-testing',
    title: 'Feature Testing Passed',
    state: 'Completed',
    priority: 'Low',
    assigneeKey: 'anais',
    projectKey: 'payments',
    labels: ['Testing'],
    dueInDays: -11,
  },
  {
    key: 'accessibility',
    title: 'Accessibility Audit',
    description: 'Keyboard traversal and contrast ratios across both themes.',
    state: 'On Hold',
    priority: 'Medium',
    assigneeKey: 'anais',
    projectKey: 'homepage',
    labels: ['Testing', 'UI/UX'],
    dueInDays: 6,
  },
  {
    key: 'design-tokens',
    title: 'Consolidate Design Tokens',
    description: 'One source of truth for colour, spacing and radius across the component library.',
    state: 'Backlog',
    priority: 'Low',
    assigneeKey: 'dexter',
    projectKey: 'homepage',
    labels: ['Design', 'Frontend'],
    dueInDays: 21,
  },
];

export function dueDateFor(offsetInDays: number): string {
  return offsetDays(offsetInDays);
}
