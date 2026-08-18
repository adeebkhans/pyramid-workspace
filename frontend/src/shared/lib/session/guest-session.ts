/**
 * Guest sessions are a pair of cookies: a flag the middleware can read on the
 * server, and the member id the client sends as the acting user.
 *
 * Both are readable by JavaScript on purpose — this is a demo identity, not a
 * credential. Real authentication goes through NextAuth, whose session cookie
 * is http-only and never touched here.
 */

export const GUEST_FLAG_COOKIE = 'pyramid.guest';
export const GUEST_MEMBER_COOKIE = 'pyramid.member';

const ONE_DAY_SECONDS = 60 * 60 * 24;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export const guestSession = {
  open(memberId: string): void {
    writeCookie(GUEST_FLAG_COOKIE, '1', ONE_DAY_SECONDS);
    writeCookie(GUEST_MEMBER_COOKIE, memberId, ONE_DAY_SECONDS);
  },

  memberId(): string | null {
    return readCookie(GUEST_MEMBER_COOKIE);
  },

  isOpen(): boolean {
    return readCookie(GUEST_FLAG_COOKIE) === '1';
  },

  close(): void {
    clearCookie(GUEST_FLAG_COOKIE);
    clearCookie(GUEST_MEMBER_COOKIE);
  },
};
