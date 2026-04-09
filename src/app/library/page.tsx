'use client';

import React, { useState, useEffect } from 'react';
import { getContent, deleteContent, markAsPosted, type ContentItem, type ContentStatus } from '@/lib/content';
import { getAccounts, type Account } from '@/lib/accounts';
import { Search, Filter, Calendar, CheckCircle2, FileText, Trash2, ExternalLink, User, Layers, Pencil } from 'lucide-react';
import MediaPreview from '@/components/MediaPreview';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<string | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { userMetadata } = useAuth();
  const { confirm } = useConfirm();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (userMetadata) refreshData();
  }, [userMetadata]);

  const refreshData = async () => {
    if (!userMetadata) return;
    setLoading(true);
    try {
      const contentData = await getContent(userMetadata.uid);
      setItems(contentData.sort((a, b) => b.createdAt - a.createdAt));
      const accountsData = await getAccounts(userMetadata.uid);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Xác nhận xóa bài',
      message: 'Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn? Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa vĩnh viễn',
      cancelLabel: 'Giữ lại',
      type: 'danger'
    });

    if (isConfirmed) {
      await deleteContent(id);
      await refreshData();
    }
  };

  const handleMarkAsPosted = async (id: string) => {
    await markAsPosted(id);
    await refreshData();
  };

  if (!mounted) return null;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.body.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
    const matchesAccount = accountFilter === 'all' || item.accountId === accountFilter;
    return matchesSearch && matchesStatus && matchesPlatform && matchesAccount;
  });

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'scheduled': return 'var(--accent-primary)';
      case 'posted': return 'var(--color-tiktok-cyan)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status: ContentStatus) => {
    switch (status) {
      case 'scheduled': return 'Đã đặt lịch';
      case 'posted': return 'Đã đăng bài';
      default: return status;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      <header className="responsive-accounts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="heading-font" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Kho Nội Dung</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Quản lý, tìm kiếm và lưu trữ bài viết.</p>
        </div>
        <Link href="/editor" className="add-acc-btn glass" style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--accent-primary)', color: 'white', fontWeight: 600, textAlign: 'center' }}>+ Viết bài mới</Link>
      </header>

      {/* Filters Bar */}
      <div className="glass" style={{ padding: 'var(--spacing-md)', borderRadius: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '2 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Tìm bài viết..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none' }}
          />
        </div>
        
        <div className="filter-group" style={{ display: 'flex', flex: '1 1 auto', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="glass custom-select"
            style={{ flex: 1, minWidth: '120px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'white', backgroundColor: 'transparent', outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#1a1b26' }}>Mọi trạng thái</option>
            <option value="scheduled" style={{ backgroundColor: '#1a1b26' }}>Đã lên lịch</option>
            <option value="posted" style={{ backgroundColor: '#1a1b26' }}>Đã đăng</option>
          </select>

          <select 
            value={platformFilter} 
            onChange={e => setPlatformFilter(e.target.value)}
            className="glass custom-select"
            style={{ flex: 1, minWidth: '120px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'white', backgroundColor: 'transparent', outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#1a1b26' }}>Mọi nền tảng</option>
            <option value="tiktok" style={{ backgroundColor: '#1a1b26' }}>TikTok</option>
            <option value="facebook" style={{ backgroundColor: '#1a1b26' }}>Facebook</option>
            <option value="threads" style={{ backgroundColor: '#1a1b26' }}>Threads</option>
          </select>

          <select 
            value={accountFilter} 
            onChange={e => setAccountFilter(e.target.value)}
            className="glass custom-select"
            style={{ flex: 1, minWidth: '120px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'white', backgroundColor: 'transparent', outline: 'none' }}
          >
            <option value="all" style={{ backgroundColor: '#1a1b26' }}>Mọi tài khoản</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} style={{ backgroundColor: '#1a1b26' }}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div style={{ position: 'relative' }}>
        {loading && <div className="nano-bar"></div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {!loading && filteredItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              Không có nội dung nào được tìm thấy.
            </div>
          ) : filteredItems.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            return (
            <div key={item.id} className="glass glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `4px solid ${getStatusColor(item.status)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: getStatusColor(item.status), letterSpacing: '0.05em' }}>
                  {getStatusLabel(item.status)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.title}</h3>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={14} /> {item.platform.toUpperCase()}
                </div>
                {account && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> {account.name}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
                {item.body}
              </p>

              {item.mediaUrl && (
                <div style={{ marginTop: '8px' }}>
                  <button 
                    onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                    className="glass"
                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <ExternalLink size={14} /> {previewId === item.id ? 'Đóng Media' : 'Xem Media'}
                  </button>
                  {previewId === item.id && (
                    <div style={{ marginTop: '12px' }}>
                      <MediaPreview url={item.mediaUrl} />
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link 
                    href={`/editor?id=${item.id}`}
                    className="icon-button" 
                    title="Chỉnh sửa bài viết"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    <Pencil size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="icon-button" 
                    title="Xóa vĩnh viễn"
                    style={{ color: 'var(--color-tiktok-pink)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {item.status === 'scheduled' && (
                  <button 
                    onClick={() => handleMarkAsPosted(item.id)}
                    className="glass"
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', backgroundColor: 'var(--color-tiktok-cyan)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} /> Xác nhận đã đăng
                  </button>
                )}

                {item.status === 'posted' && item.postedAt && (
                   <span style={{ fontSize: '0.75rem', color: 'var(--color-tiktok-cyan)', fontStyle: 'italic' }}>
                      Đã xong: {new Date(item.postedAt).toLocaleDateString('vi-VN')}
                   </span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {!loading && filteredItems.length === 0 && (
        <div className="glass" style={{ padding: '60px', borderRadius: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>Không tìm thấy bài viết nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}
