import type { Metadata } from 'next';
import { Noto_Sans_Bengali, Noto_Sans } from 'next/font/google';
import { I18nProvider } from '@/contexts/i18nContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-noto-bengali',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MaatiKatha | মাটিকথা — Farm Intelligence',
  description:
    'Zero-hardware, voice-first generational farm simulation and climate resilience platform for rural farmers in West Bengal.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'MaatiKatha — Farm Intelligence',
    description: "The farmer's voice, the soil's story.",
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFDE7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoBengali.variable}`}>
      <body className="bg-[#FFFDE7] text-black antialiased min-h-screen">
        <AuthProvider>
          <I18nProvider>{children}</I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
