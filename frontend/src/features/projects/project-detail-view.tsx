'use client';

import { ChevronRight, Columns3, MoreHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { TaskComposer } from '@/features/tasks/components/task-composer';
import { TASK_FACETS } from '@/features/tasks/components/task-facets';
import { TaskTable } from '@/features/tasks/components/task-table';
import { useTaskCollection } from '@/features/tasks/hooks/use-task-collection';
import type { Project } from '@/shared/domain/models';
import type { PriorityLevel, WorkflowState } from '@/shared/domain/workflow';
import { useAsyncResource } from '@/shared/hooks/use-async-resource';
import { useSearchField } from '@/shared/hooks/use-search-field';
import { IconButton, OutlineButton, PrimaryButton, SearchControl } from '@/shared/ui/controls';
import { FacetFilterMenu, toggleFacetValue, type FacetSelection } from '@/shared/ui/facet-filter-menu';
import { Breadcrumbs, PageHeader } from '@/shared/ui/page-header';
import { ErrorPane, LoadingPane } from '@/shared/ui/status-views';
import { projectsGateway } from './api/projects.gateway';

/**
 * A single project's task list.
 *
 * Structurally the same screen as global Tasks, scoped by `projectId` and
 * fronted by breadcrumbs — which is what the brief asks for. It reuses the
 * tasks feature's table, composer and facets rather than reimplementing them,
 * so the two views cannot drift apart.
 */
export function ProjectDetailView({ projectId }: { projectId: string }) {
  const search = useSearchField();
  const [facets, setFacets] = useState<FacetSelection>({});
  const [composerState, setComposerState] = useState<WorkflowState>('To Do');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const project = useAsyncResource<Project>((signal) => projectsGateway.get(projectId, signal), [projectId]);

  const collection = useTaskCollection({
    projectId,
    state: facets.state as WorkflowState[] | undefined,
    priority: facets.priority as PriorityLevel[] | undefined,
  });

  const visibleTasks = useMemo(() => {
    const term = search.term.trim().toLowerCase();
    if (!term) return collection.tasks;
    return collection.tasks.filter((task) => task.title.toLowerCase().includes(term));
  }, [collection.tasks, search.term]);

  const openComposer = (state: WorkflowState = 'To Do') => {
    setComposerState(state);
    setIsComposerOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <Breadcrumbs>
        <Link href="/projects" className="text-tertiary hover:text-secondary transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-3 h-3 text-tertiary mx-1" />
        <span className="text-primary font-medium">{project.data?.title ?? '...'}</span>
      </Breadcrumbs>

      <PageHeader
        title="Tasks"
        actions={
          <>
            <SearchControl
              term={search.term}
              onTermChange={search.setTerm}
              isExpanded={search.isExpanded}
              onExpand={search.expand}
              onCollapse={search.collapseIfEmpty}
              inputRef={search.inputRef}
            />

            <OutlineButton hideBelow="sm">
              <Columns3 className="w-4 h-4" />
              Fields
            </OutlineButton>

            <FacetFilterMenu
              facets={TASK_FACETS}
              selection={facets}
              onToggle={(facetKey, value) => setFacets((current) => toggleFacetValue(current, facetKey, value))}
              onClear={() => setFacets({})}
            />

            <IconButton label="More options" onlyBelow="sm">
              <MoreHorizontal className="w-4 h-4" />
            </IconButton>

            <PrimaryButton shape="pill" onClick={() => openComposer()}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </PrimaryButton>
          </>
        }
      />

      {collection.isLoading ? (
        <LoadingPane message="Loading..." />
      ) : collection.error ? (
        <ErrorPane message={collection.error} onRetry={collection.reload} />
      ) : (
        <TaskTable tasks={visibleTasks} onAddTask={openComposer} />
      )}

      <TaskComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSubmit={collection.add}
        defaultState={composerState}
        projectId={projectId}
      />
    </div>
  );
}
