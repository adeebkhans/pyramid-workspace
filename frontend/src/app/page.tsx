import { redirect } from 'next/navigation';

/**
 * The root is a signpost, not a screen. Middleware has already decided whether
 * this visitor has a session; if they reach here, they do not.
 */
export default function RootPage() {
  redirect('/sign-in');
}
