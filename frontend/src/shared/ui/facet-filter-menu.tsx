'use client';

import { Check, Filter, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useDismissable } from '@/shared/hooks/use-dismissable';
import { cx } from '@/shared/lib/cx';
import { IconButton } from './controls';

export interface FacetOption {
  value: string;
  label: string;
  /** Small leading indicator — a colour dot or a priority meter. */
  adornment?: ReactNode;
}

export interface Facet {
  key: string;
  label: string;
  icon: LucideIcon;
  options: FacetOption[];
}

export type FacetSelection = Record<string, string[]>;

/**
 * The filter control shared by the Tasks and Projects toolbars.
 *
 * The design nests a fly-out to the *left* of the trigger panel. Rather than
 * hard-coding the fields it offers, the menu is driven by a facet description
 * and reports selections back to its owner, so each screen supplies its own
 * dimensions and the two-level interaction is implemented once.
 */
export function FacetFilterMenu({
  facets,
  selection,
  onToggle,
  onClear,
}: {
  facets: Facet[];
  selection: FacetSelection;
  onToggle: (facetKey: string, value: string) => void;
  onClear?: () => void;
}) {
  const { isOpen, toggle, ref } = useDismissable<HTMLDivElement>();
  const [activeFacet, setActiveFacet] = useState<string | null>(null);

  const activeCount = Object.values(selection).reduce((total, values) => total + values.length, 0);
  const active = facets.find((facet) => facet.key === activeFacet);

  return (
    <div className="relative" ref={ref}>
      <IconButton
        label={activeCount > 0 ? `Filters (${activeCount} active)` : 'Filters'}
        onClick={() => {
          toggle();
          setActiveFacet(null);
        }}
        isActive={isOpen || activeCount > 0}
        hideBelow="sm"
      >
        <Filter className="w-4 h-4" />
      </IconButton>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50">
          <div className="relative w-[200px] bg-surface border border-default rounded-lg shadow-lg py-1">
            {facets.map(({ key, label, icon: Icon, options }) => {
              const chosen = selection[key]?.length ?? 0;

              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setActiveFacet(key)}
                  onFocus={() => setActiveFacet(key)}
                  disabled={options.length === 0}
                  className={cx(
                    'w-full flex items-center justify-between px-3 py-2 text-[13px] text-primary outline-none hover:bg-neutral-200/40 disabled:opacity-50',
                    activeFacet === key && 'bg-neutral-200/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-secondary" />
                    <span>{label}</span>
                  </div>
                  <span className="text-secondary text-xs">{chosen > 0 ? chosen : '›'}</span>
                </button>
              );
            })}

            {activeCount > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="w-full text-left px-3 py-2 text-[12px] text-secondary hover:bg-neutral-200/40 border-t border-default mt-1"
              >
                Clear all filters
              </button>
            )}

            {active && active.options.length > 0 && (
              <div
                onMouseEnter={() => setActiveFacet(active.key)}
                className="absolute top-0 right-full mr-1 w-[180px] bg-surface border border-default rounded-lg shadow-lg py-1"
              >
                <div className="px-3 py-1.5 text-[11px] text-secondary font-medium uppercase tracking-wide">
                  {active.label}
                </div>

                {active.options.map((option) => {
                  const isChosen = selection[active.key]?.includes(option.value) ?? false;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onToggle(active.key, option.value)}
                      aria-pressed={isChosen}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] hover:bg-neutral-200/40 outline-none"
                    >
                      <div className="flex items-center gap-2">
                        {option.adornment}
                        <span className="text-primary">{option.label}</span>
                      </div>
                      {isChosen && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Toggles one value inside a {@link FacetSelection} without mutating it. */
export function toggleFacetValue(selection: FacetSelection, facetKey: string, value: string): FacetSelection {
  const current = selection[facetKey] ?? [];
  const next = current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value];

  // Dropping the key entirely (rather than storing an empty array) keeps the
  // selection object a faithful description of "what is filtered".
  if (next.length === 0) {
    const rest = { ...selection };
    delete rest[facetKey];
    return rest;
  }

  return { ...selection, [facetKey]: next };
}
