'use client';

import { SessionProvider } from 'next-auth/react';

import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';

/**
 * One client boundary for the whole tree, composed in dependency order:
 * session → identity (needs the session) → theme → toasts.
 *
 * Keeping the nesting here rather than in `layout.tsx` lets the root layout
 * stay a server component.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdentityProvider>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </IdentityProvider>
    </SessionProvider>
  );
}
