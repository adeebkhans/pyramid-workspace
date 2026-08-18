import type { Metadata } from 'next';

import { SignInPanel } from '@/features/auth/sign-in-panel';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return <SignInPanel />;
}
