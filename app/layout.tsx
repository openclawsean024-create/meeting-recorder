import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '會議錄音整理工具',
  description: '邊開會邊逐字稿邊即時分析決策、行動項、風險',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎙️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <a href="#main-content" className="skip-link">跳至主要內容</a>
        {children}
      </body>
    </html>
  );
}
