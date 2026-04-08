import type { Metadata } from "next";
import "@/styles/globals.css";
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const NotificationManager = dynamic(() => import('@/components/NotificationManager'), { ssr: false });

export const metadata: Metadata = {
  title: "DCN Content CMS - Phiên bản MMO",
  description: "Hệ thống quản lý nội dung cho TikTok, Facebook và Threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="layout-grid">
          <Sidebar />
          <main style={{ padding: 'var(--spacing-xl)', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
        <NotificationManager />
      </body>
    </html>
  );
}
