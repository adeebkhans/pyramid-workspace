'use client';

import { useCallback, useRef, useState } from 'react';

import { useHotkey } from './use-hotkey';

export interface SearchFieldState {
  term: string;
  setTerm: (value: string) => void;
  isExpanded: boolean;
  expand: () => void;
  collapseIfEmpty: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * The collapsing search control shared by the Tasks, Projects and project
 * detail toolbars: a magnifier that expands into a field, collapses again when
 * blurred while empty, and answers to ⌘F / Ctrl-F.
 */
export function useSearchField(): SearchFieldState {
  const [term, setTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expand = useCallback(() => {
    setIsExpanded(true);
    // Focus after the input has been committed to the DOM.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const collapseIfEmpty = useCallback(() => {
    setTerm((current) => {
      if (!current) setIsExpanded(false);
      return current;
    });
  }, []);

  useHotkey('f', expand, { meta: true, allowInFields: true });

  return { term, setTerm, isExpanded, expand, collapseIfEmpty, inputRef };
}
