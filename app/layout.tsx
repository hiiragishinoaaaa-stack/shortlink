import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OGカード差し替え短縮リンク',
  description: 'X投稿時のOGカード画像を差し替えられる短縮リンク作成ツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
