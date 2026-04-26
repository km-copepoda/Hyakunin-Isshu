import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '百人一首パズル',
  description: '百人一首の上の句をヒントに、4択で和歌を完成させるパズルゲーム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-stone-900 text-white">{children}</body>
    </html>
  );
}
