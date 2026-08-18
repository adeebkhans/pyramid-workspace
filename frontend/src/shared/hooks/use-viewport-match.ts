'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribes to a media query.
 *
 * Starts `false` on the server and during the first client render so markup
 * matches and React does not warn about a hydration mismatch; the real value
 * lands on the effect immediately afterwards.
 */
export function useViewportMatch(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);

    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** Below this width the sidebar collapses into a drawer. */
export const COMPACT_LAYOUT_QUERY = '(max-width: 1023px)';

export function useCompactLayout(): boolean {
  return useViewportMatch(COMPACT_LAYOUT_QUERY);
}
