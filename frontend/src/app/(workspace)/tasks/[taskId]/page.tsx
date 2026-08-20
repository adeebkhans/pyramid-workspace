import type { Metadata } from 'next';

import { TaskDetailView } from '@/features/tasks/task-detail/task-detail-view';

export const metadata: Metadata = { title: 'Task' };

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskDetailView taskId={taskId} />;
}
