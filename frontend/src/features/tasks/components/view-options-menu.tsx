'use client';

import { Check, Columns3, LayoutGrid, List } from 'lucide-react';

import { useTheme } from '@/providers/theme-provider';
import { useDismissable } from '@/shared/hooks/use-dismissable';
import { cx } from '@/shared/lib/cx';
import { OutlineButton } from '@/shared/ui/controls';
import { TOGGLEABLE_FIELDS, type TaskField } from './table-columns';

export type BoardMode = 'board' | 'list';

/**
 * The "Fields" menu: switches between board and list, and toggles which columns
 * the list shows.
 *
 * The segmented control is one of the few places whose colours cannot be
 * expressed with a theme token, so it reads the active theme from context
 * rather than observing the document for a class change.
 */
export function ViewOptionsMenu({
  mode,
  onModeChange,
  visibleFields,
  onToggleField,
}: {
  mode?: BoardMode;
  onModeChange?: (mode: BoardMode) => void;
  visibleFields: TaskField[];
  onToggleField: (field: TaskField) => void;
}) {
  const { isOpen, toggle, ref } = useDismissable<HTMLDivElement>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const segmentClass = (isActive: boolean) => {
    const base =
      'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors outline-none';

    if (isDark) return cx(base, isActive ? 'bg-neutral-600 text-white' : 'bg-neutral-900 text-white');
    return cx(base, isActive ? 'bg-neutral-200/40 text-secondary' : 'bg-surface shadow-sm text-primary');
  };

  return (
    <div className="relative" ref={ref}>
      <OutlineButton onClick={toggle} isActive={isOpen} hideBelow="sm">
        <Columns3 className="w-4 h-4" />
        Fields
      </OutlineButton>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[300px] bg-surface border border-default rounded-lg shadow-lg z-50 p-2">
          {onModeChange && mode && (
            <div className="bg-neutral-200/40 rounded-md p-0.5 flex mb-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'list'}
                onClick={() => onModeChange('list')}
                className={segmentClass(mode === 'list')}
              >
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'board'}
                onClick={() => onModeChange('board')}
                className={segmentClass(mode === 'board')}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Board
              </button>
            </div>
          )}

          <div className="flex flex-col">
            {TOGGLEABLE_FIELDS.map((field) => {
              const isChecked = visibleFields.includes(field);

              return (
                <button
                  key={field}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isChecked}
                  onClick={() => onToggleField(field)}
                  className="flex items-center justify-between px-2 py-2 text-[13px] rounded hover:bg-neutral-200/40 outline-none text-primary"
                >
                  <span>{field}</span>
                  <div
                    className={cx(
                      'w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0',
                      isChecked ? 'bg-primary border-primary' : 'bg-surface border-default',
                    )}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 text-surface" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
