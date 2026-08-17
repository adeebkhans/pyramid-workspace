import type { NextConfig } from 'next';

/**
 * The browser always talks to same-origin `/api/*`. A rewrite forwards those
 * calls to the NestJS service, which means:
 *   • no CORS preflight on every request in development;
 *   • the API base URL is a deploy-time concern, not something baked into the
 *     client bundle;
 *   • `/api/auth/*` stays with NextAuth, which owns the session cookie.
 */
const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Generated member portraits.
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // Google account pictures for federated sign-in.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }],
      fallback: [],
    };
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
