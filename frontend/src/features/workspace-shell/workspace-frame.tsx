'use client';

import { PanelLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCompactLayout } from '@/shared/hooks/use-viewport-match';
import { PrimaryNav } from './primary-nav';

/**
 * The application chrome every workspace route renders inside: navigation rail,
 * a slim top bar with the rail toggle, and a single scroll container for page
 * content.
 */
export function WorkspaceFrame({ children }: { children: React.ReactNode }) {
  const isCompact = useCompactLayout();
  const [isNavOpen, setIsNavOpen] = useState(true);

  // The rail starts collapsed on small screens and expanded on large ones.
  useEffect(() => {
    setIsNavOpen(!isCompact);
  }, [isCompact]);

  return (
    <div className="flex h-screen w-full bg-page overflow-hidden">
      <PrimaryNav isOpen={isNavOpen} onOpenChange={setIsNavOpen} />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-12 border-b border-default flex items-center px-4 shrink-0 bg-surface">
          <button
            type="button"
            onClick={() => setIsNavOpen((current) => !current)}
            aria-label={isNavOpen ? 'Hide navigation' : 'Show navigation'}
            aria-expanded={isNavOpen}
            className="p-1 hover:bg-neutral-200/40 rounded text-secondary transition-colors outline-none"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-5 bg-default mx-3" />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
