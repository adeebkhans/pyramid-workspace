import type { Metadata } from 'next';

import { TasksWorkspace } from '@/features/tasks/tasks-workspace';

export const metadata: Metadata = { title: 'Tasks' };

export default function TasksPage() {
  return <TasksWorkspace />;
}
