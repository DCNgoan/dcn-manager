'use client';

import { useEffect, useRef } from 'react';
import { getContent } from '@/lib/content';
import { getSettings } from '@/lib/settings';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationManager() {
  const { userMetadata } = useAuth();
  const NOTIFIED_KEY = 'dcn_sent_notifications';
  const [logs, setLogs] = useState<string[]>(['🚀 Hệ thống quét bài đã kích hoạt...']);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 8));
    console.log(`[Notification] ${msg}`);
  };

  const isChecking = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanupOldPosts = async (items: any[], settings: any) => {
      const days = settings.autoDeleteDays || 20;
      const expiryMs = days * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      const toDelete = items.filter(item => 
        item.status === 'posted' && 
        item.postedAt && 
        (now - item.postedAt) > expiryMs
      );

      if (toDelete.length > 0) {
        const { deleteContent } = await import('@/lib/content');
        for (const item of toDelete) {
          await deleteContent(item.id);
          addLog(`🧹 Đã tự động xóa bài cũ: ${item.title.substring(0, 15)}...`);
        }
      }
    };

    const check = async () => {
      if (isChecking.current || !userMetadata) {
        return;
      }
      isChecking.current = true;

      try {
        const settings = await getSettings(userMetadata.uid);
        const chatId = settings.telegramChatId;
        const token = settings.telegramToken;

        // Startup logs
        if (logs.length <= 1) {
          if (!chatId) addLog('⚠️ Chưa cấu hình Chat ID.');
          else addLog(`✅ Hệ thống sẵn sàng (ID: ${chatId.substring(0, 4)}***)`);
        }

        if (!chatId || !token) {
          isChecking.current = false;
          return;
        }

        const items = await getContent(userMetadata.uid);
        const now = Date.now();
        
        // Heartbeat log (reduce frequency)
        if (Math.random() > 0.9) {
          addLog('💓 Hệ thống vẫn đang thức...');
        }

        // 1. Get notified list
        let notifiedIds: string[] = [];
        try {
          const stored = localStorage.getItem(NOTIFIED_KEY);
          notifiedIds = stored ? JSON.parse(stored) : [];
        } catch (e) { notifiedIds = []; }
        const notifiedSet = new Set(notifiedIds);

        // 2. Identify items to notify
        const toNotify = items.filter(item => 
          item.status === 'scheduled' && 
          item.scheduledAt && item.scheduledAt <= (now + 15 * 60 * 1000) && 
          !notifiedSet.has(item.id)
        );

        if (toNotify.length > 0) {
          for (const item of toNotify) {
            addLog(`🚀 Gửi nhắc lịch (15p): ${item.title.substring(0, 20)}...`);
            try {
              const resp = await fetch('/api/telegram/remind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, item, userId: userMetadata.uid })
              });

              if (resp.ok) {
                notifiedSet.add(item.id);
                localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(notifiedSet)));
                addLog(`✅ Đã gửi xong bài: ${item.title.substring(0, 15)}`);
              } else {
                const err = await resp.json();
                addLog(`❌ Lỗi API: ${err.error || 'N/A'}`);
              }
            } catch (err: any) {
              addLog(`❌ Lỗi Fetch: ${err.message}`);
            }
          }
        }
      } catch (globalError: any) {
        addLog(`❌ Lỗi hệ thống: ${globalError.message.substring(0, 30)}`);
      } finally {
        isChecking.current = false;
      }
    };

    // Minor sync logic
    const syncNotifiedList = () => {
      try {
        const stored = localStorage.getItem(NOTIFIED_KEY);
        if (!stored) return;
        const now = Date.now();
        let notifiedIds: string[] = JSON.parse(stored);
        if (notifiedIds.length > 100) { // Cleanup old IDs from localStorage if too many
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedIds.slice(-50)));
        }
      } catch (e) {}
    };

    if (userMetadata) {
      check();
      const interval = setInterval(check, 10000); 
      const syncInterval = setInterval(syncNotifiedList, 60000); 

      return () => {
        clearInterval(interval);
        clearInterval(syncInterval);
      };
    }
  }, [userMetadata]);

  if (!showPanel) {
    return (
      <button 
        onClick={() => setShowPanel(true)}
        className="glass"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'pointer',
          border: '1px solid var(--accent-primary)',
          color: 'var(--accent-primary)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}
        title="Mở Telegram Engine"
      >
        <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '15px',
      right: '15px',
      width: '280px',
      backgroundColor: 'rgba(10, 11, 16, 0.98)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--accent-primary)',
      borderRadius: '20px',
      padding: '12px',
      zIndex: 10000,
      boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
      fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.8)',
      fontFamily: 'var(--font-mono, monospace)',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
          <span style={{ fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>TELEGRAM ENGINE</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}>
            {isMinimized ? '+' : '−'}
          </button>
          <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
      </div>
      {!isMinimized && (
        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              padding: '2px 4px', 
              borderLeft: `2px solid ${log.includes('✅') ? '#22c55e' : log.includes('❌') ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
              color: log.includes('✅') ? '#bbf7d0' : log.includes('❌') ? '#fecaca' : 'inherit'
            }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
