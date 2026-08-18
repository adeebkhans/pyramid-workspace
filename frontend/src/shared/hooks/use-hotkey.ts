'use client';

import { useEffect, useRef } from 'react';

interface HotkeyOptions {
  /** Require ⌘ on macOS / Ctrl elsewhere. */
  meta?: boolean;
  /** Fire even when focus is inside an input or textarea. */
  allowInFields?: boolean;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Binds a keyboard shortcut for as long as the component is mounted.
 *
 * Backs the "⌘F" affordance the design places inside the search field, and
 * normalises ⌘ on macOS to Ctrl elsewhere so one binding covers both.
 */
export function useHotkey(key: string, handler: () => void, options: HotkeyOptions = {}): void {
  const { meta = false, allowInFields = false, enabled = true } = options;
  const latestHandler = useRef(handler);
  latestHandler.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (meta && !(event.metaKey || event.ctrlKey)) return;
      if (!allowInFields && isTypingTarget(event.target)) return;

      event.preventDefault();
      latestHandler.current();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, meta, allowInFields, enabled]);
}
