import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Federated sign-in.
 *
 * Google owns the credential; the API owns the member record. On first
 * sign-in we upsert the member server-to-server and carry the resulting id on
 * the JWT, so every subsequent request already knows which `Member` is acting
 * without a lookup per page.
 *
 * These calls run on the server and therefore address the API directly rather
 * than going through the browser-side `/api` rewrite.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

interface SyncedMember {
  id: string;
  name: string;
  avatarUrl: string;
}

async function syncMember(input: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<SyncedMember | null> {
  if (!input.email) return null;

  try {
    const response = await fetch(`${API_ORIGIN}/api/members/federated-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name ?? input.email.split('@')[0],
        email: input.email,
        ...(input.image ? { avatarUrl: input.image } : {}),
      }),
    });

    if (!response.ok) return null;
    return (await response.json()) as SyncedMember;
  } catch {
    // A transient API outage should not lock a user out of the sign-in flow;
    // the identity provider will retry the lookup on the next page load.
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: { signIn: '/sign-in' },

  callbacks: {
    async jwt({ token, user, account }) {
      // Only on the sign-in leg — subsequent calls reuse the stored id.
      if (account && user) {
        const member = await syncMember(user);
        if (member) {
          token.memberId = member.id;
          token.picture = member.avatarUrl ?? token.picture;
        }
      }
      return token;
    },

    session({ session, token }) {
      if (token.memberId) {
        (session.user as { memberId?: string }).memberId = token.memberId as string;
      }
      return session;
    },
  },
});
