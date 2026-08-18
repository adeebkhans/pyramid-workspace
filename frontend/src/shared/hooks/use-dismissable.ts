'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Dismissable<T extends HTMLElement> {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Attach to the element that should stay open when clicked inside. */
  ref: React.RefObject<T | null>;
}

/**
 * Open/closed state plus the click-outside and Escape handling every menu in
 * this app needs.
 *
 * Dismissal is easy to get subtly wrong — listeners that outlive the open
 * state, or a menu that traps the keyboard because nothing listens for Escape.
 * Solving it once here means every dropdown, popover and submenu behaves
 * identically for both pointer and keyboard users.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>(initiallyOpen = false): Dismissable<T> {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const ref = useRef<T | null>(null);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  return { isOpen, open, close, toggle, ref };
}
