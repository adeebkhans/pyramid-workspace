import type { NextConfig } from 'next';

const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '://dicebear.com' },
      { protocol: 'https', hostname: '://googleusercontent.com' },
    ],
  },

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Fallback routes proxy ALL method types (POST, GET, etc.) to Render 
      // ONLY if they don't match a local Vercel file or route first.
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiOrigin}/api/:path*`,
        },
      ],
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
