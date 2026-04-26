import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: '百人一首パズル',
  description: '百人一首の上の句をヒントに、4択で和歌を完成させるパズルゲーム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '百人一首',
  },
};

export const viewport: Viewport = {
  themeColor: '#1c1917',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-stone-900 text-white">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
