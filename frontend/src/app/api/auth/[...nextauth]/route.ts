import { handlers } from '@/lib/auth/auth.config';

/**
 * NextAuth owns `/api/auth/*`. Because this file is a real route it wins the
 * match before the `/api/:path*` rewrite in `next.config.ts` forwards anything
 * else to the NestJS service.
 */
export const { GET, POST } = handlers;

export const dynamic = 'force-dynamic';
