'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, updateUserStatus, type UserMetadata, type UserStatus, ADMIN_EMAIL } from '@/lib/users';
import { ShieldCheck, ShieldAlert, ShieldX, UserCheck, UserX, UserMinus, RefreshCcw, Mail, Calendar, DatabaseZap } from 'lucide-react';
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminUsersPage() {
  const { user, userMetadata } = useAuth();
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (userMetadata?.role === 'admin') {
      fetchUsers();
    }
  }, [userMetadata]);

  if (!userMetadata || userMetadata.role !== 'admin') {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h1 className="heading-font" style={{ color: 'var(--color-tiktok-pink)' }}>Truy cập bị từ chối</h1>
        <p>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const handleStatusUpdate = async (uid: string, newStatus: UserStatus) => {
    setProcessingUid(uid);
    try {
      await updateUserStatus(uid, newStatus);
      await fetchUsers();
    } catch (error) {
      alert("Cập nhật thất bại");
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReclaimData = async () => {
    if (!confirm("Hệ thống sẽ gán tất cả dữ liệu cũ (chưa có chủ sở hữu) cho tài khoản Admin của bạn. Tiếp tục?")) return;
    setLoading(true);
    try {
      const collections = ['accounts', 'content'];
      let totalUpdated = 0;

      for (const collName of collections) {
        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(d => {
          if (!d.data().userId) {
            batch.update(d.ref, { userId: userMetadata?.uid });
            count++;
          }
        });

        if (count > 0) {
          await batch.commit();
          totalUpdated += count;
        }
      }
      alert(`Đã khôi phục thành công ${totalUpdated} mục dữ liệu cho Admin.`);
    } catch (error: any) {
      alert("Lỗi khôi phục: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Quản lý Thành viên</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Phê duyệt và quản lý quyền truy cập hệ thống.</p>
        </div>
        <button onClick={handleReclaimData} className="admin-btn active-btn" style={{ height: 'fit-content' }}>
          <DatabaseZap size={16} /> Khôi phục dữ liệu cũ
        </button>
      </header>

      <div className="glass glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', textAlign: 'left' }}>Người dùng</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '16px', textAlign: 'left' }}>Ngày đăng ký</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} /> {u.email}
                          {u.email === ADMIN_EMAIL && <span className="badge badge-tiktok" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>ADMIN</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: u.status === 'active' ? 'var(--color-tiktok-cyan)' : u.status === 'pending' ? 'var(--accent-secondary)' : 'var(--color-tiktok-pink)' }}>
                      {u.status === 'active' ? <ShieldCheck size={14} /> : u.status === 'pending' ? <ShieldAlert size={14} /> : <ShieldX size={14} />}
                      <span style={{ textTransform: 'capitalize' }}>{u.status === 'active' ? 'Đã duyệt' : u.status === 'pending' ? 'Chờ duyệt' : 'Đã chặn'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {u.email !== ADMIN_EMAIL && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {u.status !== 'active' && (
                          <button 
                            onClick={() => handleStatusUpdate(u.uid, 'active')}
                            disabled={processingUid === u.uid}
                            className="admin-btn active-btn"
                          >
                            <UserCheck size={16} /> Duyệt
                          </button>
                        )}
                        {u.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(u.uid, 'rejected')}
                            disabled={processingUid === u.uid}
                            className="admin-btn reject-btn"
                          >
                            <UserX size={16} /> Chặn
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <RefreshCcw className="spin" size={24} />
          </div>
        )}
      </div>

    </div>
  );
}
