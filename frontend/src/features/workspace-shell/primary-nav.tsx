'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useCompactLayout } from '@/shared/hooks/use-viewport-match';
import { cx } from '@/shared/lib/cx';
import { AccountMenu } from './account-menu';
import { WORKSPACE_NAVIGATION } from './navigation';

/**
 * The 232px rail. On desktop it is a static column; below 1024px the same
 * markup becomes a slide-in drawer with a scrim, so there is exactly one
 * navigation implementation rather than a mobile fork.
 */
export function PrimaryNav({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();
  const isCompact = useCompactLayout();

  // Following a link on a phone should reveal the destination, not the menu.
  useEffect(() => {
    if (isCompact) onOpenChange(false);
  }, [pathname, isCompact, onOpenChange]);

  if (!isOpen && !isCompact) return null;

  const rail = (
    <div
      className={cx(
        'w-[232px] h-full bg-page border-r border-default p-3 flex flex-col',
        isCompact && 'shadow-xl relative',
      )}
    >
      <AccountMenu />

      <div className="mt-4">
        <div className="flex items-center justify-between px-2 mb-1 cursor-pointer group">
          <span className="text-[12px] font-medium text-secondary group-hover:text-primary">Workspace</span>
          <ChevronDown className="w-3.5 h-3.5 text-secondary" />
        </div>

        <nav className="flex flex-col gap-[2px]">
          {WORKSPACE_NAVIGATION.map(({ href, label, icon: Icon, match }) => {
            const isCurrent = pathname?.startsWith(match) ?? false;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                className={cx(
                  'flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors',
                  isCurrent
                    ? 'bg-neutral-200/40 text-primary'
                    : 'text-secondary hover:bg-neutral-200/40 hover:text-primary',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  if (!isCompact) return rail;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cx(
          'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {rail}
      </div>
    </>
  );
}
