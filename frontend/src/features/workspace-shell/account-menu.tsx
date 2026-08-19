'use client';

import { ChevronDown, ChevronRight, ChevronUp, Moon, Settings, Sun } from 'lucide-react';
import { useState } from 'react';

import { useIdentity } from '@/providers/identity-provider';
import { ACCENT_SWATCHES, useTheme, type AccentMode, type ThemeMode } from '@/providers/theme-provider';
import { useDismissable } from '@/shared/hooks/use-dismissable';
import { cx } from '@/shared/lib/cx';
import { MemberAvatar } from '@/shared/ui/member-avatar';

type Submenu = 'theme' | 'accent' | null;

const ROW = 'w-full flex items-center justify-between px-3 py-[7px] text-[13px] text-primary outline-none hover:bg-neutral-200/40';

/**
 * The identity control at the top of the sidebar: who you are, plus the theme
 * and accent pickers the design nests beneath it.
 *
 * Both submenus fly out to the right of the panel and are mutually exclusive,
 * so only one is ever measuring against the viewport edge.
 */
export function AccountMenu() {
  const { isOpen, toggle, ref } = useDismissable<HTMLDivElement>();
  const [submenu, setSubmenu] = useState<Submenu>(null);
  const { theme, accent, setTheme, setAccent } = useTheme();
  const { member } = useIdentity();

  const openSubmenu = (next: Exclude<Submenu, null>) => setSubmenu((current) => (current === next ? null : next));

  const chooseTheme = (mode: ThemeMode) => setTheme(mode);
  const chooseAccent = (mode: AccentMode) => setAccent(mode);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cx(
          'w-full flex items-center justify-between px-1.5 py-1 rounded-md transition-colors outline-none',
          isOpen ? 'bg-neutral-200/40' : 'hover:bg-neutral-200/40',
        )}
      >
        <div className="flex items-center gap-2">
          <MemberAvatar member={member} size={26} />
          <span className="text-[13px] font-medium text-primary">{member?.name ?? '...'}</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <ChevronUp className="w-3 h-3 text-secondary stroke-[2.5] -mb-0.5" />
          <ChevronDown className="w-3 h-3 text-secondary stroke-[2.5] -mt-0.5" />
        </div>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1.5 w-[210px] bg-surface border border-default rounded-xl shadow-xl z-50"
        >
          <div className="flex flex-col items-center gap-2.5 px-4 pt-8 pb-6 border-b border-default">
            <MemberAvatar member={member} size={52} />
            <div className="text-center">
              <div className="text-[14px] font-semibold text-primary leading-tight">{member?.name ?? '...'}</div>
              <div className="text-[12px] text-secondary leading-tight mt-0.5">{member?.email ?? ''}</div>
            </div>
          </div>

          <div className="py-1">
            {/* Theme */}
            <div className="relative">
              <button type="button" onClick={() => openSubmenu('theme')} className={ROW}>
                <div className="flex items-center gap-2.5">
                  <Sun className="w-[15px] h-[15px] text-secondary" />
                  <span>Change Theme</span>
                </div>
                <ChevronRight
                  className={cx('w-3.5 h-3.5 text-secondary transition-transform', submenu === 'theme' && 'rotate-90')}
                />
              </button>

              {submenu === 'theme' && (
                <div className="absolute top-0 left-full ml-1 w-[140px] bg-surface border border-default rounded-xl shadow-xl py-1 z-[60]">
                  <button type="button" onClick={() => chooseTheme('light')} className={ROW}>
                    <div className="flex items-center gap-2">
                      <Sun className="w-[15px] h-[15px]" />
                      <span>Light</span>
                    </div>
                    {theme === 'light' && <span className="text-accent-primary text-[12px]">✓</span>}
                  </button>
                  <button type="button" onClick={() => chooseTheme('dark')} className={ROW}>
                    <div className="flex items-center gap-2">
                      <Moon className="w-[15px] h-[15px]" />
                      <span>Dark</span>
                    </div>
                    {theme === 'dark' && <span className="text-accent-primary text-[12px]">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Accent */}
            <div className="relative">
              <button type="button" onClick={() => openSubmenu('accent')} className={ROW}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[15px] h-[15px] rounded-[3px] bg-accent-primary border border-black/10" />
                  <span>Color Mode</span>
                </div>
                <ChevronRight
                  className={cx('w-3.5 h-3.5 text-secondary transition-transform', submenu === 'accent' && 'rotate-90')}
                />
              </button>

              {submenu === 'accent' && (
                <div className="absolute top-0 left-full ml-1 w-[148px] bg-surface border border-default rounded-xl shadow-xl py-1 z-[60]">
                  {ACCENT_SWATCHES.map((swatch) => (
                    <button key={swatch.id} type="button" onClick={() => chooseAccent(swatch.id)} className={ROW}>
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-[3px]" style={{ backgroundColor: swatch.hex }} />
                        <span>{swatch.label}</span>
                      </div>
                      {accent === swatch.id && <span className="text-accent-primary text-[12px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a href="/settings" className="flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-primary hover:bg-neutral-200/40">
              <Settings className="w-[15px] h-[15px] text-secondary" />
              <span>Settings</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
