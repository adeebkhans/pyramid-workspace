'use client';

import { BarChart2, Columns3, MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useToast } from '@/providers/toast-provider';
import type { Project } from '@/shared/domain/models';
import { PRIORITY_LEVELS, type PriorityLevel } from '@/shared/domain/workflow';
import { useAsyncResource } from '@/shared/hooks/use-async-resource';
import { useSearchField } from '@/shared/hooks/use-search-field';
import { describeError } from '@/shared/lib/http/api-client';
import { IconButton, OutlineButton, PrimaryButton, SearchControl } from '@/shared/ui/controls';
import { FacetFilterMenu, toggleFacetValue, type Facet, type FacetSelection } from '@/shared/ui/facet-filter-menu';
import { PageHeader } from '@/shared/ui/page-header';
import { PriorityMeter } from '@/shared/ui/priority-meter';
import { ErrorPane, LoadingPane } from '@/shared/ui/status-views';
import { projectsGateway, type ProjectDraft } from './api/projects.gateway';
import { ProjectComposer } from './components/project-composer';
import { ProjectTable } from './components/project-table';

const PROJECT_FACETS: Facet[] = [
  {
    key: 'priority',
    label: 'Priority',
    icon: BarChart2,
    options: PRIORITY_LEVELS.map((priority) => ({
      value: priority,
      label: priority,
      adornment: <PriorityMeter priority={priority} showLabel={false} />,
    })),
  },
];

export function ProjectsWorkspace() {
  const { reportError } = useToast();
  const search = useSearchField();
  const [facets, setFacets] = useState<FacetSelection>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const priorityFilter = facets.priority as PriorityLevel[] | undefined;
  const filterKey = JSON.stringify(priorityFilter ?? []);

  const resource = useAsyncResource<Project[]>(
    (signal) => projectsGateway.list({ priority: JSON.parse(filterKey) as PriorityLevel[] }, signal),
    [filterKey],
  );

  const projects = useMemo(() => {
    const term = search.term.trim().toLowerCase();
    const all = resource.data ?? [];
    return term ? all.filter((project) => project.title.toLowerCase().includes(term)) : all;
  }, [resource.data, search.term]);

  const addProject = useCallback(
    async (draft: ProjectDraft): Promise<Project | null> => {
      try {
        const created = await projectsGateway.create(draft);
        resource.set((current) => [...(current ?? []), created]);
        return created;
      } catch (cause) {
        reportError(describeError(cause));
        return null;
      }
    },
    [reportError, resource],
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <PageHeader
        title="Projects"
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
              facets={PROJECT_FACETS}
              selection={facets}
              onToggle={(facetKey, value) => setFacets((current) => toggleFacetValue(current, facetKey, value))}
              onClear={() => setFacets({})}
            />

            <IconButton label="More options" onlyBelow="sm">
              <MoreHorizontal className="w-4 h-4" />
            </IconButton>

            <PrimaryButton onClick={() => setIsComposerOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Project</span>
            </PrimaryButton>
          </>
        }
      />

      {resource.isLoading ? (
        <LoadingPane message="Loading projects..." />
      ) : resource.error ? (
        <ErrorPane message={resource.error} onRetry={resource.refresh} />
      ) : (
        <ProjectTable projects={projects} onAddProject={() => setIsComposerOpen(true)} />
      )}

      <ProjectComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSubmit={addProject}
      />
    </div>
  );
}
