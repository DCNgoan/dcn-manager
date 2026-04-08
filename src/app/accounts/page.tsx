'use client';

import React, { useState, useEffect } from 'react';
import { getAccounts, saveAccount, deleteAccount, type Account, type Platform } from '@/lib/accounts';
import { Plus, Trash2, ExternalLink, ShieldCheck, ShieldAlert, ShieldX, RefreshCcw, Users, Heart, Pencil, Key } from 'lucide-react';
import { updateAccount } from '@/lib/accounts';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    platform: 'tiktok' as Platform,
    status: 'active' as Account['status'],
    profileUrl: '',
    notes: '',
    apiKey: ''
  });
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    const data = await getAccounts();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchAccounts();
  }, []);

  if (!mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;
    
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, newAccount);
      } else {
        await saveAccount(newAccount);
      }
      
      await fetchAccounts();
      setShowAddModal(false);
      setEditingAccount(null);
      setNewAccount({ name: '', platform: 'tiktok', status: 'active', profileUrl: '', notes: '', apiKey: '' });
    } catch (error) {
      alert('Lưu tài khoản thất bại: ' + (error as Error).message);
    }
  };

  const startEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNewAccount({
      name: acc.name,
      platform: acc.platform,
      status: acc.status,
      profileUrl: acc.profileUrl || '',
      notes: acc.notes || '',
      apiKey: acc.apiKey || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoàn này?')) {
      try {
        await deleteAccount(id);
        await fetchAccounts();
      } catch (error) {
        alert('Xóa tài khoản thất bại');
      }
    }
  };

  const handleSync = async (acc: Account) => {
    if (!acc.profileUrl) return;
    setSyncingId(acc.id);
    
    try {
      const res = await fetch(`/api/accounts/sync-stats?url=${encodeURIComponent(acc.profileUrl)}&platform=${acc.platform}`);
      const data = await res.json();
      
      if (data.followers) {
        await updateAccount(acc.id, {
          followers: data.followers,
          likes: data.likes,
          lastSync: data.lastSync
        });
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '2rem', fontWeight: 700 }}>Quản lý Tài khoản</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Quản lý dàn tài khoản MMO đa kênh của bạn.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ 
            backgroundColor: 'var(--accent-primary)', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
          }}
        >
          <Plus size={20} /> Thêm tài khoản
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {['tiktok', 'facebook', 'threads', 'other'].map(platform => {
          const platformAccounts = accounts.filter(acc => acc.platform === platform);
          if (platformAccounts.length === 0) return null;

          return (
            <section key={platform}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-lg)', borderLeft: `4px solid var(--color-${platform === 'tiktok' ? 'tiktok-pink' : platform === 'facebook' ? 'facebook-blue' : 'tiktok-cyan'})`, paddingLeft: '16px' }}>
                <h2 className="heading-font" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
                  Hệ thống {platform}
                </h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '20px' }}>
                  {platformAccounts.length} tài khoản
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {platformAccounts.map(acc => (
                  <div key={acc.id} className="glass glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className={`badge badge-${acc.platform}`}>{acc.platform}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {acc.profileUrl && (
                          <button 
                            onClick={() => handleSync(acc)}
                            disabled={syncingId === acc.id}
                            style={{ color: 'var(--accent-secondary)', opacity: syncingId === acc.id ? 0.3 : 0.8 }}
                            className={syncingId === acc.id ? 'spin' : ''}
                            title="Cập nhật chỉ số"
                          >
                            <RefreshCcw size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => startEdit(acc)}
                          style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
                          title="Chỉnh sửa tài khoản"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(acc.id)}
                          style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
                          className="hover-red"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{acc.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: acc.status === 'active' ? 'var(--color-tiktok-cyan)' : 'var(--color-tiktok-pink)' }}>
                        {acc.status === 'active' ? <ShieldCheck size={14} /> : acc.status === 'warning' ? <ShieldAlert size={14} /> : <ShieldX size={14} />}
                        <span style={{ textTransform: 'capitalize' }}>{acc.status === 'active' ? 'Hoạt động' : acc.status === 'warning' ? 'Cảnh báo' : 'Bị khóa'}</span>
                      </div>
                    </div>

                    {acc.profileUrl && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <a 
                            href={acc.profileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--accent-secondary)' }}
                          >
                            <ExternalLink size={14} /> Hồ sơ
                          </a>
                          {acc.apiKey && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#22c55e' }}>
                              <Key size={14} /> <span style={{ opacity: 0.8 }}>API Active</span>
                            </div>
                          )}
                        </div>
                        {acc.lastSync && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                            {new Date(acc.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {(acc.followers || acc.likes) && (
                      <div style={{ display: 'flex', gap: '12px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                        {acc.followers && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={14} style={{ color: 'var(--accent-secondary)' }} />
                            <span style={{ fontWeight: 600 }}>{acc.followers}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Followers</span>
                          </div>
                        )}
                        {acc.likes && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Heart size={14} style={{ color: 'var(--color-tiktok-pink)' }} />
                            <span style={{ fontWeight: 600 }}>{acc.likes}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Likes</span>
                          </div>
                        )}
                      </div>
                    )}

                    {acc.notes && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        &quot;{acc.notes}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: '16px' }}>
              <RefreshCcw size={32} />
            </div>
            <p>Đang tải dữ liệu từ Firebase...</p>
          </div>
        ) : accounts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', border: '2px dashed var(--glass-border)', borderRadius: '20px', color: 'var(--text-secondary)' }}>
            <p>Chưa có tài khoản nào. Hãy nhấn &quot;Thêm tài khoản&quot; để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Modal - Basic implementation */}
      {/* Modal - Advanced implementation */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: 'var(--spacing-xl)', borderRadius: '24px' }}>
            <h2 className="heading-font" style={{ marginBottom: 'var(--spacing-xl)' }}>
              {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tên tài khoản / Nickname</label>
                <input 
                  type="text" 
                  required
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Ví dụ: TikTok Global 01"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nền tảng</label>
                  <select 
                    value={newAccount.platform}
                    onChange={e => setNewAccount({...newAccount, platform: e.target.value as Platform})}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'white', outline: 'none' }}
                  >
                    <option value="tiktok" style={{ backgroundColor: 'var(--bg-primary)' }}>TikTok</option>
                    <option value="facebook" style={{ backgroundColor: 'var(--bg-primary)' }}>Facebook</option>
                    <option value="threads" style={{ backgroundColor: 'var(--bg-primary)' }}>Threads</option>
                    <option value="other" style={{ backgroundColor: 'var(--bg-primary)' }}>Khác</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Trạng thái</label>
                  <select 
                    value={newAccount.status}
                    onChange={e => setNewAccount({...newAccount, status: e.target.value as any})}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'white', outline: 'none' }}
                  >
                    <option value="active" style={{ backgroundColor: 'var(--bg-primary)' }}>Hoạt động</option>
                    <option value="warning" style={{ backgroundColor: 'var(--bg-primary)' }}>Cảnh báo</option>
                    <option value="banned" style={{ backgroundColor: 'var(--bg-primary)' }}>Bị khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Link profile (Tùy chọn)</label>
                <input 
                  type="url" 
                  value={newAccount.profileUrl}
                  onChange={e => setNewAccount({...newAccount, profileUrl: e.target.value})}
                  placeholder="https://tiktok.com/@user"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={14} /> API Key / Access Token
                </label>
                <input 
                  type="password" 
                  value={newAccount.apiKey || ''}
                  onChange={e => setNewAccount({...newAccount, apiKey: e.target.value})}
                  placeholder="Dán token riêng cho tài khoản này (nếu có)"
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Ghi chú</label>
                <textarea 
                  value={newAccount.notes}
                  onChange={e => setNewAccount({...newAccount, notes: e.target.value})}
                  placeholder="Ví dụ: Tài khoản nuôi tech, Group MMO..."
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', minHeight: '60px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingAccount(null); }}
                  style={{ flex: 1, padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  style={{ flex: 2, backgroundColor: 'var(--accent-primary)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                >
                  {editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
