'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  // Render a simplified version during hydration to prevent mismatch
  if (!mounted) {
    return (
      <aside className="glass" style={{ height: '100vh', padding: 'var(--spacing-xl)', borderRight: '1px solid var(--glass-border)', width: '280px' }}>
        <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(45deg, var(--color-tiktok-pink), var(--color-tiktok-cyan), var(--color-facebook-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>DCN CMS</h1>
      </aside>
    );
  }

  return (
    <aside className="glass" style={{ height: '100vh', padding: 'var(--spacing-xl)', borderRight: '1px solid var(--glass-border)', width: '280px' }}>
      <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(45deg, var(--color-tiktok-pink), var(--color-tiktok-cyan), var(--color-facebook-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>DCN CMS</h1>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <NavLink href="/" label="Bảng điều khiển" active={isActive('/')} />
        <NavLink href="/accounts" label="Quản lý Tài khoản" active={isActive('/accounts')} />
        <NavLink href="/editor" label="Soạn thảo Nội dung" active={isActive('/editor')} />
        <NavLink href="/calendar" label="Lịch đăng bài" active={isActive('/calendar')} />
        <NavLink href="/library" label="Kho Nội dung" active={isActive('/library')} />
        <NavLink href="/settings" label="Cài đặt hệ thống" active={isActive('/settings')} />
        <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)', letterSpacing: '0.1em' }}>Nền tảng</p>
          <NavLink href="/tiktok" label="TikTok" color="var(--color-tiktok-pink)" active={isActive('/tiktok')} />
          <NavLink href="/facebook" label="Facebook" color="var(--color-facebook-blue)" active={isActive('/facebook')} />
          <NavLink href="/threads" label="Threads" color="var(--color-threads-white)" active={isActive('/threads')} />
        </div>
      </nav>
    </aside>
  );
}

function NavLink({ href, label, active = false, color }: { href: string; label: string; active?: boolean; color?: string }) {
  return (
    <Link 
      href={href} 
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
