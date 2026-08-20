'use client';

import { MoreHorizontal, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PriorityLevel, WorkflowState } from '@/shared/domain/workflow';
import { useSearchField } from '@/shared/hooks/use-search-field';
import { IconButton, PrimaryButton, SearchControl } from '@/shared/ui/controls';
import { FacetFilterMenu, toggleFacetValue, type FacetSelection } from '@/shared/ui/facet-filter-menu';
import { PageHeader } from '@/shared/ui/page-header';
import { ErrorPane, LoadingPane } from '@/shared/ui/status-views';
import { BoardCanvas } from './components/board-canvas';
import { TaskComposer } from './components/task-composer';
import { TaskTable } from './components/task-table';
import { TASK_FACETS } from './components/task-facets';
import { DEFAULT_VISIBLE_FIELDS, type TaskField } from './components/table-columns';
import { ViewOptionsMenu, type BoardMode } from './components/view-options-menu';
import { useTaskCollection } from './hooks/use-task-collection';

/**
 * The Tasks screen.
 *
 * Filtering is split by cost: facet selections travel to the API (they narrow
 * the result set and change rarely), while the search term filters the loaded
 * page in memory so typing stays instant. Both feed the same board/list pair.
 */
export function TasksWorkspace() {
  const [mode, setMode] = useState<BoardMode>('board');
  const [fields, setFields] = useState<TaskField[]>(DEFAULT_VISIBLE_FIELDS);
  const [facets, setFacets] = useState<FacetSelection>({});
  const [composerState, setComposerState] = useState<WorkflowState>('To Do');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const search = useSearchField();

  const collection = useTaskCollection({
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

  const toggleField = (field: TaskField) => {
    setFields((current) =>
      current.includes(field) ? current.filter((entry) => entry !== field) : [...current, field],
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface">
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

            <ViewOptionsMenu
              mode={mode}
              onModeChange={setMode}
              visibleFields={fields}
              onToggleField={toggleField}
            />

            <FacetFilterMenu
              facets={TASK_FACETS}
              selection={facets}
              onToggle={(facetKey, value) => setFacets((current) => toggleFacetValue(current, facetKey, value))}
              onClear={() => setFacets({})}
            />

            <IconButton label="More options" onlyBelow="sm">
              <MoreHorizontal className="w-4 h-4" />
            </IconButton>

            <PrimaryButton onClick={() => openComposer()}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </PrimaryButton>
          </>
        }
      />

      {collection.isLoading ? (
        <LoadingPane message="Loading tasks..." />
      ) : collection.error ? (
        <ErrorPane message={collection.error} onRetry={collection.reload} />
      ) : mode === 'board' ? (
        <BoardCanvas tasks={visibleTasks} onAddTask={openComposer} onReorder={collection.reorder} />
      ) : (
        <TaskTable tasks={visibleTasks} fields={fields} onAddTask={openComposer} />
      )}

      <TaskComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSubmit={collection.add}
        defaultState={composerState}
      />
    </div>
  );
}
