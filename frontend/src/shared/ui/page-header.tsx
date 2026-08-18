import type { ReactNode } from 'react';

/**
 * The title-plus-actions bar at the top of Tasks, Projects and project detail.
 *
 * Owning the frame in one component keeps the header pixel-identical across all
 * three screens — spacing is the first thing to drift when a layout is restated
 * per page — and leaves each page declaring nothing but its own actions.
 */
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 shrink-0">
      <h1 className="text-[20px] font-bold text-primary">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Breadcrumb strip above the header on the project detail screen. */
export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center px-6 pt-4 text-[13px]">
      {children}
    </nav>
  );
}
