'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, userMetadata, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  if (!mounted) {
    return (
      <aside className="glass sidebar-inner">
        <h1 className="heading-font logo">DCN CMS</h1>
      </aside>
    );
  }

  return (
    <aside className="glass sidebar-inner">
      <h1 className="heading-font logo hidden-mobile">DCN CMS</h1>
      
      <nav className="nav-container">
        <NavLink href="/" label="Bảng điều khiển" active={isActive('/')} onClick={onNavigate} />
        <NavLink href="/accounts" label="Quản lý Tài khoản" active={isActive('/accounts')} onClick={onNavigate} />
        <NavLink href="/editor" label="Soạn thảo Nội dung" active={isActive('/editor')} onClick={onNavigate} />
        <NavLink href="/calendar" label="Lịch đăng bài" active={isActive('/calendar')} onClick={onNavigate} />
        <NavLink href="/library" label="Kho Nội dung" active={isActive('/library')} onClick={onNavigate} />
        <NavLink href="/settings" label="Cài đặt hệ thống" active={isActive('/settings')} onClick={onNavigate} />
        
        {userMetadata?.role === 'admin' && (
          <div className="nav-divider" style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)' }}>
            <p className="nav-section-title">Quản trị</p>
            <NavLink href="/admin/users" label="Quản lý Thành viên" active={isActive('/admin/users')} onClick={onNavigate} color="var(--accent-secondary)" />
          </div>
        )}
        
        <div className="nav-divider">
          <p className="nav-section-title">Nền tảng</p>
          <NavLink href="/tiktok" label="TikTok" color="var(--color-tiktok-pink)" active={isActive('/tiktok')} onClick={onNavigate} />
          <NavLink href="/facebook" label="Facebook" color="var(--color-facebook-blue)" active={isActive('/facebook')} onClick={onNavigate} />
          <NavLink href="/threads" label="Threads" color="var(--color-threads-white)" active={isActive('/threads')} onClick={onNavigate} />
        </div>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-profile">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder"><UserIcon size={16} /></div>
            )}
            <div className="user-info">
              <span className="user-name">{user.displayName || 'Người dùng'}</span>
            </div>
            <button onClick={logout} className="logout-btn" title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}

function NavLink({ href, label, active = false, color, onClick }: { href: string; label: string; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 16px', 
        borderRadius: '12px', 
        fontSize: '0.95rem',
        fontWeight: active ? 600 : 400,
        backgroundColor: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        transition: 'var(--transition-fast)',
        color: active ? 'white' : 'var(--text-secondary)',
        borderLeft: color ? `3px solid ${color}` : 'none',
        marginLeft: color ? '8px' : '0'
      }}
      className="nav-link-hover"
    >
      {label}
    </Link>
  );
}
