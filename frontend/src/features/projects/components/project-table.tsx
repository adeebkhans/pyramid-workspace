'use client';

import { MoreHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';

import type { Project } from '@/shared/domain/models';
import { EmptyPane } from '@/shared/ui/status-views';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { PriorityMeter } from '@/shared/ui/priority-meter';

/**
 * The projects list. Rows restack into cards below `sm`, matching the task list
 * so the two screens behave identically on a phone.
 */
export function ProjectTable({ projects, onAddProject }: { projects: Project[]; onAddProject: () => void }) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-6 pb-6">
      <div className="border border-default rounded-lg overflow-hidden bg-surface">
        <div className="flex flex-col">
          <div className="hidden sm:flex items-center px-3 py-2 bg-column-bg text-[12px] font-medium text-secondary">
            <div className="flex-[2] min-w-0">Projects</div>
            <div className="w-[120px] shrink-0">Priority</div>
            <div className="w-[100px] shrink-0">Lead</div>
            <div className="w-[120px] shrink-0">Due Date</div>
            <div className="w-[60px] shrink-0 text-right">Actions</div>
          </div>

          {projects.length === 0 && <EmptyPane title="No projects yet" hint="Create one to group related tasks." />}

          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex flex-col sm:flex-row sm:items-center px-3 py-3 border-b border-default hover:bg-neutral-200/20 transition-colors group cursor-pointer text-[13px] gap-2 sm:gap-0 outline-none"
            >
              <div className="flex-[2] min-w-0 font-medium text-primary pr-4 flex justify-between items-start">
                <span className="truncate">{project.title}</span>
                <button
                  type="button"
                  aria-label="Project actions"
                  onClick={(event) => event.preventDefault()}
                  className="sm:hidden text-tertiary p-1"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="flex sm:w-[120px] shrink-0 items-center gap-2">
                <span className="sm:hidden text-secondary text-[12px] w-16">Priority</span>
                <PriorityMeter priority={project.priority} />
              </div>

              <div className="flex sm:w-[100px] shrink-0 items-center gap-2">
                <span className="sm:hidden text-secondary text-[12px] w-16">Lead</span>
                <MemberAvatar member={project.lead} size={18} />
              </div>

              <div className="flex sm:w-[120px] shrink-0 items-center gap-2 text-primary">
                <span className="sm:hidden text-secondary text-[12px] w-16">Due Date</span>
                {project.dueDate ?? '-'}
              </div>

              <div className="hidden sm:flex w-[60px] shrink-0 justify-end">
                <button
                  type="button"
                  aria-label="Project actions"
                  onClick={(event) => event.preventDefault()}
                  className="text-neutral-400 hover:text-neutral-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))}

          <button
            type="button"
            onClick={onAddProject}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-tertiary hover:bg-neutral-200/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />+ Add Project
          </button>
        </div>
      </div>
    </div>
  );
}
