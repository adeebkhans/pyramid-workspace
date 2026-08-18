'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Member } from '@/shared/domain/models';
import { apiClient, describeError } from '@/shared/lib/http/api-client';
import { guestSession } from '@/shared/lib/session/guest-session';
import { GoogleMark, PyramidMark } from '@/shared/ui/spiral-icon';

type PendingAction = 'guest' | 'google' | null;

const WORKSPACE_ROUTE = '/tasks';

/**
 * Where to land after signing in.
 *
 * Read from `window.location` at click time rather than through
 * `useSearchParams`, which would opt the whole panel into a Suspense boundary
 * and leave the card client-only — a visible blank flash on first paint. Only
 * same-site paths are honoured, so `?next=https://evil.example` cannot turn
 * sign-in into an open redirect.
 */
function resolveDestination(): string {
  if (typeof window === 'undefined') return WORKSPACE_ROUTE;

  const requested = new URLSearchParams(window.location.search).get('next');
  if (!requested) return WORKSPACE_ROUTE;

  const isSafeInternalPath = requested.startsWith('/') && !requested.startsWith('//');
  return isSafeInternalPath ? requested : WORKSPACE_ROUTE;
}

/**
 * Two ways in.
 *
 * Guest sign-in asks the API to mint a member with its own name and its own
 * generated portrait, so a visitor without an account is still a real identity
 * for the rest of the workspace — their comments are attributed to them and
 * two people can explore the demo at once without colliding.
 */
export function SignInPanel() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState('');

  const continueAsGuest = async () => {
    setPending('guest');
    setError('');

    try {
      const member = await apiClient.post<Member>('/members/guest-session');
      guestSession.open(member.id);
      router.push(resolveDestination());
      router.refresh();
    } catch (cause) {
      setError(describeError(cause));
      setPending(null);
    }
  };

  const continueWithGoogle = async () => {
    setPending('google');
    setError('');

    try {
      await signIn('google', { callbackUrl: resolveDestination() });
    } catch (cause) {
      setError(describeError(cause));
      setPending(null);
    }
  };

  const isBusy = pending !== null;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center w-full max-w-[420px]">
        <div className="flex items-center gap-2 mb-6">
          <PyramidMark size={28} />
          <span className="text-[15px] font-bold text-neutral-900">Pyramid</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-7 w-full shadow-sm">
          <h1 className="text-[18px] font-bold text-center text-neutral-900 mb-1">Let&apos;s get back on track</h1>
          <p className="text-[13px] text-center text-neutral-500 mb-5">
            Enter your email below to login to your account.
          </p>

          {error && (
            <p role="alert" className="text-[12px] text-red-500 text-center mb-3">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={continueAsGuest}
              disabled={isBusy}
              className="flex items-center justify-center w-full h-10 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {pending === 'guest' ? 'Signing in...' : 'Continue as Guest'}
            </button>

            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={isBusy}
              className="flex items-center justify-center w-full h-10 bg-white border border-neutral-300 text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-50 transition-colors relative disabled:opacity-50"
            >
              {pending === 'google' ? (
                <span className="text-sm">Redirecting...</span>
              ) : (
                <>
                  <GoogleMark className="w-4 h-4 mr-2" />
                  Login with Google
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-neutral-400 text-center leading-relaxed">
          By clicking continue, you agree to
          <br />
          our{' '}
          <a href="#" className="text-neutral-500 underline hover:text-neutral-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-neutral-500 underline hover:text-neutral-700">
            Privacy
          </a>
          <br />
          <a href="#" className="text-neutral-500 underline hover:text-neutral-700">
            Policy
          </a>
        </p>
      </div>
    </div>
  );
}
