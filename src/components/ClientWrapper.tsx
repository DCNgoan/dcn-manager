'use client';

import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const NotificationManager = dynamic(() => import('@/components/NotificationManager'), { ssr: false });

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-grid">
      <Sidebar />
      <main style={{ padding: 'var(--spacing-xl)', overflowY: 'auto' }}>
        {children}
      </main>
      <NotificationManager />
    </div>
  );
}
