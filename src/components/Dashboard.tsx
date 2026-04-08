'use client';

import React, { useEffect, useState } from "react";
import { getContent, ContentItem, markAsPosted } from "@/lib/content";
import { getAccounts, Account, saveAccount } from "@/lib/accounts";
import { saveContent } from "@/lib/content";
import MediaPreview from "@/components/MediaPreview";
import { Play, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledToday: 0,
    tiktokCount: 0,
    fbThreadsCount: 0
  });
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    setMounted(true);
    const initData = async () => {
      const currentAccounts = await getAccounts();
      const currentContent = await getContent();

      if (currentAccounts.length === 0 && currentContent.length === 0) {
        const acc1 = await saveAccount({ name: 'TikTok_Acc_01', platform: 'tiktok', status: 'active' });
        const acc2 = await saveAccount({ name: 'FB_Page_Business', platform: 'facebook', status: 'warning' });
        const acc3 = await saveAccount({ name: 'Threads_Global', platform: 'threads', status: 'active' });

        await saveContent({
          title: 'DCN - Cách Scale Ads TikTok',
          body: 'Nội dung mẫu về TikTok Ads...',
          platform: 'tiktok',
          accountId: acc1.id,
          status: 'scheduled',
          scheduledAt: Date.now() + 7200000 
        });

        await saveContent({
          title: 'Facebook Reels - Viral Hacks 2024',
          body: 'Nội dung mẫu về Facebook Reels...',
          platform: 'facebook',
          accountId: acc2.id,
          status: 'draft'
        });

        await saveContent({
          title: 'Chiến lược Threads cho MMO',
          body: 'Nội dung mẫu về Threads...',
          platform: 'threads',
          accountId: acc3.id,
          status: 'posted'
        });
      }
      await refreshData();
    };
    initData();
  }, []);

  const refreshData = async () => {
    const allContent = await getContent();
    const allAccounts = await getAccounts();

    const today = new Date().setHours(0, 0, 0, 0);
    const tomorrow = new Date().setHours(24, 0, 0, 0);

    const scheduledToday = allContent.filter(item => 
      item.status === 'scheduled' && 
      item.scheduledAt && 
      item.scheduledAt >= today && 
      item.scheduledAt < tomorrow
    ).length;

    setStats({
      totalPosts: allContent.length,
      scheduledToday,
      tiktokCount: allAccounts.filter(a => a.platform === 'tiktok').length,
      fbThreadsCount: allAccounts.filter(a => a.platform === 'facebook' || a.platform === 'threads').length
    });

    setRecentContent(allContent.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3));
    setAccounts(allAccounts);
  };

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)', position: 'relative' }}>
        <h1 className="heading-font" style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
          Chào mừng trở lại, <span style={{ color: 'var(--accent-primary)' }}>Nắm vùng MMO</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Dưới đây là tổng quan các tài khoản của bạn hôm nay.
        </p>
      </header>

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <StatCard label="Tổng bài đăng" value={stats.totalPosts.toString()} platform="all" />
        <StatCard label="Lên lịch hôm nay" value={stats.scheduledToday.toString()} platform="all" />
        <StatCard label="Tài khoản TikTok" value={stats.tiktokCount.toString().padStart(2, '0')} platform="tiktok" />
        <StatCard label="FB/Threads" value={stats.fbThreadsCount.toString().padStart(2, '0')} platform="facebook" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Recent Activity */}
        <section className="glass glass-card">
          <h2 className="heading-font" style={{ marginBottom: 'var(--spacing-lg)' }}>Nội dung gần đây</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {recentContent.length > 0 ? recentContent.map(item => (
              <ContentEntry 
                key={item.id}
                id={item.id}
                title={item.title} 
                platform={item.platform} 
                time={formatTimeAgo(item.createdAt)} 
                status={item.status === 'scheduled' ? 'Đã lên lịch' : item.status === 'draft' ? 'Bản nháp' : 'Đã đăng'} 
                isPosted={item.status === 'posted'}
                mediaUrl={item.mediaUrl}
                onMarkAsPosted={async (id) => {
                  await markAsPosted(id);
                  await refreshData();
                }}
              />
            )) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Chưa có nội dung nào.</p>
            )}
          </div>
        </section>

        {/* Account Health */}
        <section className="glass glass-card">
          <h2 className="heading-font" style={{ marginBottom: 'var(--spacing-lg)' }}>Sức khỏe Tài khoản</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {accounts.length > 0 ? accounts.map(acc => (
              <HealthItem 
                key={acc.id}
                name={acc.name} 
                status={acc.status === 'active' ? 'Khỏe mạnh' : acc.status === 'warning' ? 'Cảnh báo' : 'Bị khóa'} 
                percent={acc.status === 'active' ? 100 : acc.status === 'warning' ? 45 : 0} 
              />
            )) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Chưa có tài khoản nào.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, platform }: { label: string; value: string; platform: string }) {
  const getColor = () => {
    switch(platform) {
      case 'tiktok': return 'var(--color-tiktok-pink)';
      case 'facebook': return 'var(--color-facebook-blue)';
      default: return 'var(--accent-primary)';
    }
  };

  return (
    <div className="glass glass-card" style={{ borderTop: `4px solid ${getColor()}` }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>{label}</p>
      <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{value}</h3>
    </div>
  );
}

function ContentEntry({ id, title, platform, time, status, isPosted, mediaUrl, onMarkAsPosted }: { id: string; title: string; platform: string; time: string; status: string; isPosted: boolean; mediaUrl?: string; onMarkAsPosted: (id: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge badge-${platform}`} style={{ textTransform: 'uppercase' }}>{platform}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{title}</span>
          {mediaUrl && (
            <button 
              onClick={() => setShowPreview(!showPreview)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--accent-secondary)', fontSize: '0.7rem', border: 'none' }}
            >
              {showPreview ? <ChevronUp size={12} /> : <Play size={12} />}
              {showPreview ? 'Đóng' : 'Xem Media'}
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '0.75rem', color: isPosted ? 'var(--color-tiktok-cyan)' : 'var(--accent-secondary)' }}>{status}</p>
            {!isPosted && (
              <button 
                onClick={() => onMarkAsPosted(id)}
                className="glass"
                style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--color-tiktok-cyan)', 
                  color: 'white', 
                  fontSize: '0.7rem', 
                  border: 'none', 
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Xong
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showPreview && mediaUrl && (
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
          <MediaPreview url={mediaUrl} />
        </div>
      )}
    </div>
  );
}

function HealthItem({ name, status, percent }: { name: string; status: string; percent: number }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
        <span>{name}</span>
        <span style={{ color: status === 'Khỏe mạnh' ? 'var(--color-tiktok-cyan)' : 'var(--color-tiktok-pink)' }}>{status}</span>
      </div>
      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px' }}>
        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: status === 'Khỏe mạnh' ? 'var(--color-tiktok-cyan)' : 'var(--color-tiktok-pink)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
