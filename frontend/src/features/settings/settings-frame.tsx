'use client';

import { ArrowLeft, Search, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cx } from '@/shared/lib/cx';

/**
 * Settings deliberately does not reuse the workspace shell: the design gives it
 * its own full-height layout with a dedicated rail and no top bar.
 */
export function SettingsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfile = pathname === '/settings';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-page">
      <div className="w-full md:w-[232px] shrink-0 bg-page border-b md:border-b-0 md:border-r border-default p-3 flex flex-col">
        <Link
          href="/tasks"
          className="flex items-center gap-2 text-[13px] text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </Link>

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            aria-label="Search settings"
            className="w-full h-[32px] pl-9 pr-3 border border-default rounded-md text-[13px] bg-surface text-primary outline-none focus:border-neutral-400"
          />
        </div>

        <nav className="flex flex-row md:flex-col gap-2 md:gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Link
            href="/settings"
            className={cx(
              'flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap',
              isProfile ? 'bg-neutral-200/40 text-primary font-semibold' : 'text-secondary hover:bg-neutral-200/40',
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>

          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:bg-neutral-200/40 outline-none transition-colors text-left whitespace-nowrap"
          >
            <Sun className="w-4 h-4" />
            Theme
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-medium text-secondary hover:bg-neutral-200/40 outline-none transition-colors text-left whitespace-nowrap"
          >
            <div className="w-4 h-4 rounded-sm bg-accent-primary" />
            Color
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface">{children}</div>
    </div>
  );
}
