'use client';

import React, { useState, useEffect } from 'react';
import { getContent, deleteContent, markAsPosted, type ContentItem } from '@/lib/content';
import { getAccounts, type Account } from '@/lib/accounts';
import MediaPreview from '@/components/MediaPreview';
import { Copy, ExternalLink, Trash2, Calendar as CalIcon, Filter, Clock, MoreVertical, Edit, Play, ChevronUp, CheckCircle2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function CalendarPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const { userMetadata } = useAuth();

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      if (!userMetadata) return;
      setLoading(true);
      try {
        const allContent = await getContent(userMetadata.uid);
        const activeContent = allContent.filter(c => c.status !== 'posted');
        setContent(activeContent.sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0)));
        setAccounts(await getAccounts(userMetadata.uid));
      } catch (error) {
        console.error("Calendar fetchData error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userMetadata) fetchData();
  }, [userMetadata]);

  if (!mounted) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép nội dung vào bộ nhớ tạm!');
  };

  const getAccountName = (id: string) => {
    return accounts.find(a => a.id === id)?.name || 'Unknown Account';
  };

  const filteredContent = filterPlatform === 'all' 
    ? content 
    : content.filter(c => c.platform === filterPlatform);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <header className="responsive-accounts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="heading-font responsive-title" style={{ fontWeight: 700 }}>Lịch nội dung</h1>
          <p className="responsive-subtitle" style={{ color: 'var(--text-secondary)' }}>Quản lý lịch đăng bài và sao chép nhanh nội dung.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: 'auto' }}>
          <select 
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)', color: 'white', outline: 'none' }}
          >
            <option value="all">Tất cả nền tảng</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
            <option value="threads">Threads</option>
          </select>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)', position: 'relative' }}>
        {loading && <div className="nano-bar"></div>}
        {['tiktok', 'facebook', 'threads', 'other'].map(platform => {
          const platformContent = filteredContent.filter(c => c.platform === platform);
          if (platformContent.length === 0 && filterPlatform !== 'all') return null;
          if (platformContent.length === 0 && filterPlatform === 'all') return null;

          return (
            <section key={platform} className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '24px', borderLeft: `6px solid var(--color-${platform === 'tiktok' ? 'tiktok-pink' : platform === 'facebook' ? 'facebook-blue' : 'tiktok-cyan'})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h2 className="heading-font" style={{ fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${platform}`}>{platform}</span>
                  Lịch đăng {platform}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {platformContent.length} bài đăng
                </span>
              </div>

              <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {platformContent.map(item => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    accountName={getAccountName(item.accountId)} 
                    onCopy={handleCopy}
                    onDelete={async (id) => {
                      if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
                        await deleteContent(id);
                        if (userMetadata) {
                          const allContent = await getContent(userMetadata.uid);
                          setContent(allContent.filter(c => c.status !== 'posted'));
                        }
                      }
                    }}
                    onMarkAsPosted={async (id) => {
                      await markAsPosted(id);
                      if (userMetadata) {
                        const allContent = await getContent(userMetadata.uid);
                        setContent(allContent.filter(c => c.status !== 'posted'));
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredContent.length === 0 && (
          <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px', border: '2px dashed var(--glass-border)' }}>
             <CalIcon size={48} style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
             <p style={{ color: 'var(--text-secondary)' }}>Chưa có bài đăng nào được lên lịch cho nền tảng này.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentCard({ item, accountName, onCopy, onDelete, onMarkAsPosted }: { item: ContentItem, accountName: string, onCopy: (t: string) => void, onDelete: (id: string) => void, onMarkAsPosted: (id: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const formattedDate = item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Chưa lên lịch';
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div className="glass glass-card responsive-calendar-card">
        {/* Time/Status Column */}
        <div className="time-column" style={{ textAlign: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
            {item.scheduledAt ? new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
            {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '---'}
          </p>
        </div>

        {/* Content Info Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge badge-${item.platform}`}>{item.platform}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {accountName}</span>
          </div>
          <h3 className="heading-font" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{item.title}</h3>
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-secondary)', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical' 
          }}>
            {item.body}
          </p>
        </div>

        {/* Action Column */}
        <div className="action-column" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {item.mediaUrl && (
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="glass"
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  color: 'var(--accent-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {showPreview ? <ChevronUp size={16} /> : <Play size={16} />}
                {showPreview ? 'Đóng' : 'Xem'}
              </button>
            )}
            
            <Link 
              href={`/editor?id=${item.id}`}
              className="glass"
              style={{ 
                padding: '10px', 
                borderRadius: '10px', 
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
              title="Chỉnh sửa bài đăng"
            >
              <Pencil size={16} /> <span className="hidden-mobile">Sửa</span>
            </Link>

            <button 
              onClick={() => onCopy(item.body)}
              className="glass"
              style={{ 
                padding: '10px', 
                borderRadius: '10px', 
                color: 'var(--color-tiktok-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
              title="Sao chép nội dung bài đăng"
            >
              <Copy size={16} /> Sao chép
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {item.mediaUrl && (
              <a 
                href={item.mediaUrl} 
                target="_blank" 
                rel="noreferrer"
                className="glass"
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  color: 'var(--color-facebook-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
                title="Mở link Drive gốc"
              >
                <ExternalLink size={16} /> Drive
              </a>
            )}

            <button 
              onClick={() => onDelete(item.id)}
              style={{ padding: '10px', color: 'var(--color-tiktok-pink)', opacity: 0.5 }}
              title="Xóa bài đăng"
            >
              <Trash2 size={16} />
            </button>

            {item.status === 'scheduled' && (
              <button 
                onClick={() => onMarkAsPosted(item.id)}
                className="glass"
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--color-tiktok-cyan)', 
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle2 size={14} /> Xong
              </button>
            )}
          </div>
        </div>
      </div>

      {showPreview && item.mediaUrl && (
        <div className="glass" style={{ padding: '16px', borderRadius: '16px', marginTop: '4px' }}>
          <MediaPreview url={item.mediaUrl} />
        </div>
      )}
    </div>
  );
}
