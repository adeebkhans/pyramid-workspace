import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AppProviders } from '@/providers/app-providers';
import { themeBootstrapScript } from '@/providers/theme-provider';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Pyramid';

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: 'Plan, track and ship work across projects — boards, lists and task detail in one workspace.',
  applicationName: appName,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f8' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint — see theme-provider. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${inter.className} bg-page text-primary antialiased`} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
