'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError } from '@/shared/lib/http/api-client';

export interface AsyncResource<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** Re-runs the loader; use after a mutation that the server may reshape. */
  refresh: () => Promise<void>;
  /** Writes a value locally without a round-trip — the optimistic-update seam. */
  set: (next: T | ((current: T | null) => T)) => void;
}

/**
 * Loads server state into a component with the three things every such call
 * needs: a loading flag, a surfaced error, and cancellation on unmount so a
 * slow response cannot set state on a tree that has gone away.
 *
 * Deliberately small — a data-fetching library would be the right answer for a
 * bigger app, but this is the whole contract these screens use.
 */
export function useAsyncResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[] = [],
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const run = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loaderRef.current(signal);
      if (!signal.aborted && isMounted.current) setData(result);
    } catch (cause) {
      if (signal.aborted || (cause instanceof DOMException && cause.name === 'AbortError')) return;
      if (isMounted.current) setError(describeError(cause));
    } finally {
      if (!signal.aborted && isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void run(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    await run(controller.signal);
  }, [run]);

  const set = useCallback((next: T | ((current: T | null) => T)) => {
    setData((current) => (typeof next === 'function' ? (next as (value: T | null) => T)(current) : next));
  }, []);

  return { data, isLoading, error, refresh, set };
}
