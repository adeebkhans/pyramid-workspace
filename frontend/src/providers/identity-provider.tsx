'use client';

import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { Member } from '@/shared/domain/models';
import { apiClient } from '@/shared/lib/http/api-client';
import { guestSession } from '@/shared/lib/session/guest-session';

interface IdentityContextValue {
  member: Member | null;
  isResolving: boolean;
  /** Convenience for the many callers that only need "who is acting". */
  actorId: string | null;
  refresh: () => void;
}

const IdentityContext = createContext<IdentityContextValue>({
  member: null,
  isResolving: true,
  actorId: null,
  refresh: () => {},
});

/**
 * Resolves "who is using this app" once, at the top of the tree.
 *
 * Two doors lead in — a Google session owned by NextAuth, or a guest cookie —
 * and both end at the same `Member` record on the API. Resolving it here means
 * no component has to know which door was used, and the account menu, the
 * settings page and every authored comment agree on the answer.
 */
export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [member, setMember] = useState<Member | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;

    let cancelled = false;
    setIsResolving(true);

    const resolve = async (): Promise<Member | null> => {
      const email = session?.user?.email;

      if (status === 'authenticated' && email) {
        // The auth callback has already upserted this member server-side.
        return apiClient.get<Member | null>(`/members/by-email/${encodeURIComponent(email)}`);
      }

      const guestId = guestSession.memberId();
      if (guestId) return apiClient.get<Member>(`/members/${guestId}`);

      return null;
    };

    resolve()
      .then((resolved) => {
        if (!cancelled) setMember(resolved);
      })
      .catch(() => {
        // A stale cookie pointing at a deleted member should log the session
        // out quietly rather than wedge the shell in a loading state.
        if (!cancelled) setMember(null);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email, nonce]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      member,
      isResolving,
      actorId: member?.id ?? null,
      refresh: () => setNonce((current) => current + 1),
    }),
    [member, isResolving],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  return useContext(IdentityContext);
}

/** Shorthand for the common case. */
export function useCurrentMember(): Member | null {
  return useIdentity().member;
}
