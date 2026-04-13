import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '會議錄音整理工具',
  description: '邊開會邊逐字稿邊即時分析決策、行動項、風險',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎙️</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
