'use client';

import React, { useState, useEffect } from 'react';
import { getContent, type ContentItem } from '@/lib/content';
import { getAccounts, type Account } from '@/lib/accounts';
import { useParams } from 'next/navigation';
import { Copy, ExternalLink, User, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function PlatformPage() {
  const params = useParams();
  const platform = params.platform as string;
  const [content, setContent] = useState<ContentItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const refreshData = async () => {
    const allContent = await getContent();
    const allAccounts = await getAccounts();
    setContent(allContent.filter(c => c.platform === platform && c.status !== 'posted'));
    setAccounts(allAccounts.filter(a => a.platform === platform));
  };

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, [platform]);

  if (!mounted) return null;

  const filteredContent = selectedAccountId 
    ? content.filter(c => c.accountId === selectedAccountId)
    : content;

  const formatVNTime = (timestamp?: number) => {
    if (!timestamp) return 'Bản nháp';
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(timestamp));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className={`badge badge-${platform}`} style={{ fontSize: '0.9rem', padding: '10px 20px', borderRadius: '14px', fontWeight: 800, textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            {platform}
          </span>
          <h1 className="heading-font" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Nội dung {platform === 'facebook' ? 'Facebook' : platform.charAt(0).toUpperCase() + platform.slice(1)}</h1>
        </div>
        
        {selectedAccountId && (
          <button 
            onClick={() => setSelectedAccountId(null)}
            style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid var(--accent-primary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Hiện tất cả tài khoản
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--spacing-xl)' }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-lg)' }}>
            <Calendar size={20} color="var(--text-secondary)" />
            <h2 className="heading-font" style={{ fontSize: '1.4rem' }}>
              {selectedAccountId ? `Lịch đăng: ${accounts.find(a => a.id === selectedAccountId)?.name}` : 'Tất cả bài đăng đã lên lịch'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {!selectedAccountId ? (
              <div style={{ textAlign: 'center', padding: '60px', borderRadius: '20px', border: '2px dashed var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <User size={48} color="var(--accent-primary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ color: 'white', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
                  Sẵn sàng quản lý nội dung!
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Vui lòng chọn một tài khoản từ danh sách bên phải để xem lịch đăng bài chi tiết.
                </p>
              </div>
            ) : filteredContent.length > 0 ? filteredContent.map(item => (
              <div key={item.id} className="glass glass-card platform-card-hover" style={{ transition: 'transform 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 className="heading-font" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Clock size={14} />
                    {formatVNTime(item.scheduledAt)}
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.5', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.body}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="var(--text-secondary)" />
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {accounts.find(a => a.id === item.accountId)?.name || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(item.body); alert('Đã sao chép nội dung bài viết!'); }}
                      className="glass" 
                      style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-tiktok-cyan)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(37, 244, 238, 0.2)' }}
                    >
                      <Copy size={16} /> Sao chép
                    </button>
                    <button 
                      onClick={async () => { await markAsPosted(item.id); await refreshData(); }}
                      className="glass" 
                      style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#00f2ea', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(0, 242, 234, 0.2)' }}
                    >
                      <CheckCircle size={16} /> Đã đăng
                    </button>
                    <button 
                      onClick={async () => { await deleteContent(item.id); await refreshData(); }}
                      className="glass" 
                      style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#ff0050', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255, 0, 80, 0.2)' }}
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                    {item.mediaUrl && (
                      <a 
                        href={item.mediaUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="glass" 
                        style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-facebook-blue)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(24, 119, 242, 0.2)' }}
                      >
                        <ExternalLink size={16} /> Mở Drive
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '60px', borderRadius: '20px', border: '2px dashed var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <AlertCircle size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  Chưa có nội dung nào được lên lịch cho {platform.toUpperCase()}.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="glass glass-card" style={{ position: 'sticky', top: '20px' }}>
            <h2 className="heading-font" style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} /> Tài khoản của bạn
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {accounts.length > 0 ? accounts.map(acc => (
                <button 
                  key={acc.id} 
                  onClick={() => setSelectedAccountId(acc.id)}
                  style={{ 
                    textAlign: 'left',
                    width: '100%',
                    padding: '14px', 
                    borderRadius: '14px', 
                    border: `1px solid ${selectedAccountId === acc.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                    backgroundColor: selectedAccountId === acc.id ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: selectedAccountId === acc.id ? 'white' : 'var(--text-secondary)' }}>{acc.name}</span>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: acc.status === 'active' ? '#00f2ea' : '#ff0050',
                      boxShadow: `0 0 10px ${acc.status === 'active' ? '#00f2ea' : '#ff0050'}` 
                    }}></span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {acc.status === 'active' ? 'Đang hoạt động' : 'Cảnh báo/Khóa'}
                  </p>
                </button>
              )) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Chưa có tài khoản nào được thêm.</p>
              )}
            </div>
            
            {accounts.length > 0 && (
              <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                Nhấn vào tài khoản để xem lịch đăng riêng.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
