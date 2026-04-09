'use client';

import React, { useState, useEffect } from 'react';
import { getAccounts, saveAccount, deleteAccount, type Account, type Platform } from '@/lib/accounts';
import { Plus, Trash2, ExternalLink, ShieldCheck, ShieldAlert, ShieldX, RefreshCcw, Users, Heart, Pencil, Key } from 'lucide-react';
import { updateAccount } from '@/lib/accounts';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';

export default function AccountsPage() {
  const { userMetadata } = useAuth();
  const { confirm } = useConfirm();
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

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchAccounts = async () => {
    if (!userMetadata) return;
    setFetching(true);
    try {
      const data = await getAccounts(userMetadata.uid);
      setAccounts(data);
    } catch (error: any) {
      console.error("Fetch Accounts Error:", error);
      alert('Không thể tải danh sách tài khoản: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (userMetadata) fetchAccounts();
  }, [userMetadata]);

  if (!mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name.trim()) {
      alert('Vui lòng nhập tên tài khoản!');
      return;
    }
    
    setSaving(true);
    try {
      console.log("Saving account for user:", userMetadata?.uid);
      if (editingAccount) {
        await updateAccount(editingAccount.id, { ...newAccount, userId: userMetadata?.uid || '' });
      } else {
        if (!userMetadata) throw new Error("Chưa đăng nhập");
        await saveAccount({ ...newAccount, userId: userMetadata.uid });
      }
      
      console.log("Account saved successfully");
      await fetchAccounts();
      setShowAddModal(false);
      setEditingAccount(null);
      setNewAccount({ name: '', platform: 'tiktok', status: 'active', profileUrl: '', notes: '', apiKey: '' });
    } catch (error: any) {
      console.error("Save Account Error:", error);
      alert('Lưu tài khoản thất bại: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setSaving(false);
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
    const isConfirmed = await confirm({
      title: 'Xóa tài khoản',
      message: 'Bạn có chắc chắn muốn xóa tài khoản này không? Tất cả các liên kết liên quan sẽ bị ảnh hưởng.',
      confirmLabel: 'Đồng ý xóa',
      cancelLabel: 'Quay lại',
      type: 'danger'
    });

    if (isConfirmed) {
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length && accounts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirm({
      title: 'Xoá nhiều tài khoản',
      message: `Bạn đã chọn ${selectedIds.length} tài khoản. Bạn có chắc chắn muốn xóa tất cả vĩnh viễn không?`,
      confirmLabel: 'Xác nhận xóa hết',
      type: 'danger'
    });

    if (isConfirmed) {
      setSaving(true);
      try {
        for (const id of selectedIds) {
          await deleteAccount(id);
        }
        await fetchAccounts();
        setSelectedIds([]);
      } catch (error) {
        alert('Xóa hàng loạt thất bại');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="responsive-accounts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="heading-font responsive-title" style={{ fontWeight: 700 }}>Quản lý Tài khoản</h1>
          <p className="responsive-subtitle" style={{ color: 'var(--text-secondary)' }}>Quản lý dàn tài khoản MMO đa kênh của bạn.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="add-acc-btn"
          style={{ 
            backgroundColor: 'var(--accent-primary)', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={20} /> <span className="hidden-mobile">Thêm tài khoản</span>
          <span className="visible-mobile">Thêm mới</span>
        </button>
      </header>

      {selectedIds.length > 0 && (
        <div className="glass" style={{ 
          position: 'sticky', top: '70px', zIndex: 100, 
          padding: '12px 20px', borderRadius: '16px', 
          marginBottom: 'var(--spacing-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid var(--accent-primary)',
          backgroundColor: 'rgba(124, 58, 237, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              checked={selectedIds.length === accounts.length}
              onChange={toggleSelectAll}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600 }}>Đã chọn {selectedIds.length} tài khoản</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setSelectedIds([])}
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Bỏ chọn
            </button>
            <button 
              onClick={handleBulkDelete}
              disabled={saving}
              style={{ 
                backgroundColor: 'var(--color-tiktok-pink)', 
                color: 'white', padding: '6px 16px', 
                borderRadius: '8px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Trash2 size={16} /> Xóa đã chọn
            </button>
          </div>
        </div>
      )}

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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {platformAccounts.map(acc => (
                  <div key={acc.id} className="glass glass-card" style={{ 
                    display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)',
                    position: 'relative',
                    border: selectedIds.includes(acc.id) ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)'
                  }}>
                    <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(acc.id)}
                        onChange={() => toggleSelect(acc.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '24px' }}>
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

        {fetching && <div className="nano-bar"></div>}
        
        {!fetching && accounts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', border: '2px dashed var(--glass-border)', borderRadius: '20px', color: 'var(--text-secondary)' }}>
            <p>Chưa có tài khoản nào. Hãy nhấn &quot;Thêm tài khoản&quot; để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Modal - Basic implementation */}
      {/* Modal - Advanced implementation */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass modal-content" style={{ width: '100%', maxWidth: '500px', padding: 'var(--spacing-xl)', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="heading-font" style={{ marginBottom: 'var(--spacing-xl)', fontSize: '1.5rem' }}>
              {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </h2>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
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
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  style={{ 
                    flex: 2, 
                    backgroundColor: saving ? 'var(--glass-border)' : 'var(--accent-primary)', 
                    color: 'white', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    fontWeight: 700,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                      Đang lưu...
                    </>
                  ) : (
                    editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
