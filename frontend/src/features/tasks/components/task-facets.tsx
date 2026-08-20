import { BarChart2, Circle } from 'lucide-react';

import { PRIORITY_LEVELS, STATE_DOT, WORKFLOW_STATES } from '@/shared/domain/workflow';
import { PriorityMeter } from '@/shared/ui/priority-meter';
import type { Facet } from '@/shared/ui/facet-filter-menu';

/**
 * The facets the task filter menu offers. Kept beside the tasks feature rather
 * than in the shared menu, which stays domain-agnostic.
 */
export const TASK_FACETS: Facet[] = [
  {
    key: 'state',
    label: 'Status',
    icon: Circle,
    options: WORKFLOW_STATES.map((state) => ({
      value: state,
      label: state,
      adornment: <div className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[state]}`} />,
    })),
  },
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
