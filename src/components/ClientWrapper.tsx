'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Menu, X, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const NotificationManager = dynamic(() => import('@/components/NotificationManager'), { ssr: false });

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user, userMetadata, loading, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await login();
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg("Lỗi: Google Login chưa được bật trong Firebase Console.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg("Bạn đã đóng cửa sổ đăng nhập.");
      } else {
        setErrorMsg("Lỗi: " + (err.message || "Không thể đăng nhập"));
      }
    }
  };

  if (loading || (user && !userMetadata)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-overlay">
        <div className="login-card glass glass-card">
          <h1 className="heading-font logo" style={{ fontSize: '3rem', marginBottom: '2rem' }}>DCN CMS</h1>
          <h2 className="heading-font" style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Chào mừng trở lại</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Đăng nhập bằng Google để quản lý hệ thống MMO của bạn.</p>
          
          {errorMsg && (
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(254, 44, 85, 0.1)', color: 'var(--color-tiktok-pink)', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid var(--color-tiktok-pink)' }}>
              {errorMsg}
            </div>
          )}

          <button onClick={handleLogin} className="login-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Tiếp tục với Google
          </button>
        </div>
      </div>
    );
  }

  if (userMetadata && userMetadata.status === 'pending') {
    return (
      <div className="login-overlay">
        <div className="login-card glass glass-card">
          <div className="animate-bounce" style={{ marginBottom: '24px' }}>
            <LogIn size={48} color="var(--accent-secondary)" />
          </div>
          <h2 className="heading-font" style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Đang chờ phê duyệt</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Tài khoản <strong>{user.email}</strong> đã được đăng ký. 
            Vui lòng chờ Admin xác nhận để bắt đầu sử dụng hệ thống.
          </p>
          <button 
            onClick={async () => {
              console.log("Logout button clicked");
              await logout();
            }} 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'underline', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '10px'
            }}
          >
            Đăng xuất tài khoản khác
          </button>
        </div>
      </div>
    );
  }

  if (userMetadata && userMetadata.status === 'rejected') {
    return (
      <div className="login-overlay">
        <div className="login-card glass glass-card">
          <h2 className="heading-font" style={{ marginBottom: '12px', fontSize: '1.8rem', color: 'var(--color-tiktok-pink)' }}>Truy cập bị từ chối</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Yêu cầu truy cập của bạn đã bị từ chối. Vui lòng liên hệ Admin để biết thêm chi tiết.
          </p>
          <button onClick={logout} className="login-btn">Quay lại đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="glass visible-mobile mobile-header" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px', zIndex: 1000, 
        alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--spacing-md)'
      }}>
        <h1 className="heading-font" style={{ 
          fontSize: '1.2rem', fontWeight: 800, 
          background: 'linear-gradient(45deg, var(--color-tiktok-pink), var(--color-tiktok-cyan), var(--color-facebook-blue))', 
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
        }}>DCN CMS</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ color: 'var(--text-primary)', padding: '8px' }}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div className="layout-grid">
        {isSidebarOpen && (
          <div onClick={() => setIsSidebarOpen(false)} style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.3s ease-out'
            }} className="visible-mobile" />
        )}

        <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`} style={{ zIndex: 1001 }}>
          <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>

        <main className="main-content" style={{ padding: 'var(--spacing-xl)', overflowY: 'auto', minHeight: '100vh', position: 'relative', flexGrow: 1 }}>
          {children}
        </main>
        <NotificationManager />
      </div>
    </>
  );
}
