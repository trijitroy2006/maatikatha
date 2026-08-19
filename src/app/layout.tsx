import type { Metadata } from 'next';
import { Noto_Sans_Bengali, Noto_Sans } from 'next/font/google';
import { I18nProvider } from '@/contexts/i18nContext';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-bengali',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'মাটিকথা | MaatiKatha',
  description:
    'Zero-hardware, voice-first generational farm simulation and climate resilience platform for rural farmers in West Bengal.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'মাটিকথা | MaatiKatha',
    description: 'কৃষকের কণ্ঠস্বর, মাটির কথা',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1c1917',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoBengali.variable}`}>
      <body className="bg-stone-950 text-stone-100 antialiased min-h-screen">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
