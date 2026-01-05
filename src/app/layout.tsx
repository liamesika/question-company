import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0b',
};

export const metadata: Metadata = {
  title: 'Business Operations Diagnostic | Discover Your Operational Load',
  description:
    'Your business is growing — but are your operations keeping up? Take our 2-minute diagnostic and discover your real operational chaos score.',
  keywords: [
    'business operations',
    'operational efficiency',
    'business diagnostic',
    'operations assessment',
    'business growth',
    'operational chaos',
    'business scaling',
  ],
  authors: [{ name: 'Business Operations Diagnostic' }],
  creator: 'Business Operations Diagnostic',
  publisher: 'Business Operations Diagnostic',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Business Operations Diagnostic | Discover Your Operational Load',
    description:
      'Your business is growing — but are your operations keeping up? Take our 2-minute diagnostic.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Business Operations Diagnostic',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Operations Diagnostic',
    description:
      'Your business is growing — but are your operations keeping up? Take our 2-minute diagnostic.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-dark-900 text-white antialiased">
        <main className="relative min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
