import type { NextConfig } from 'next';

/**
 * The browser always talks to same-origin `/api/*`. Edge middleware forwards those
 * calls to the NestJS service, which means:
 *   • no CORS preflight on every request in development or production;
 *   • the API base URL is a deploy-time concern, not something baked into the
 *     client bundle;
 *   • `/api/auth/*` stays with NextAuth, which owns the session cookie.
 */
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
      afterFiles: [],
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
