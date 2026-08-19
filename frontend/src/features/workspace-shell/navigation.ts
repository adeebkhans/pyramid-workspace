import { Folder, LayoutGrid, type LucideIcon } from 'lucide-react';

export interface NavigationEntry {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Route prefix that marks this entry as current. */
  match: string;
}

/**
 * Workspace navigation as data.
 *
 * The sidebar renders whatever is in this array, so adding a section is a
 * one-line change here and the active-state styling is decided in exactly one
 * place.
 */
export const WORKSPACE_NAVIGATION: readonly NavigationEntry[] = [
  { href: '/tasks', label: 'Tasks', icon: LayoutGrid, match: '/tasks' },
  { href: '/projects', label: 'Projects', icon: Folder, match: '/projects' },
];
