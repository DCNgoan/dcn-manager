'use client';

import { useEffect, useRef } from 'react';
import { getContent } from '@/lib/content';
import { getSettings } from '@/lib/settings';

import { useState } from 'react';

export default function NotificationManager() {
  const NOTIFIED_KEY = 'dcn_sent_notifications';
  const [logs, setLogs] = useState<string[]>(['🚀 Hệ thống quét bài đã kích hoạt...']);

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
      if (isChecking.current) return;
      isChecking.current = true;

      try {
        const items = await getContent();
        const settings = await getSettings();
        const chatId = settings.telegramChatId;

        // Chạy cleanup mỗi lần check
        await cleanupOldPosts(items, settings);

        if (!chatId) {
          if (logs.length <= 1) addLog('⚠️ Chưa cấu hình Chat ID trong Cài đặt.');
          console.log('NotificationManager: Settings from Firestore:', settings);
          return;
        } else {
          // Chỉ hiện log thành công 1 lần duy nhất khi vừa khởi động
          if (logs.length <= 1) {
            addLog(`✅ Đã nhận Chat ID: ${chatId.substring(0, 4)}***`);
            if (settings.telegramToken) {
              addLog(`🤖 Bot Token đã sẵn sàng.`);
            }
          }
        }

        // Lấy danh sách đã gửi
        let notifiedIds: string[] = [];
        try {
          const stored = localStorage.getItem(NOTIFIED_KEY);
          notifiedIds = stored ? JSON.parse(stored) : [];
        } catch (e) { notifiedIds = []; }
        
        const notifiedSet = new Set(notifiedIds);
        
        const now = Date.now();
        const scheduledItems = items.filter(item => item.status === 'scheduled' && item.scheduledAt);
        
        // Log status if we have scheduled items
        if (scheduledItems.length > 0 && Math.random() > 0.7) { 
           const nextItem = [...scheduledItems].sort((a,b) => (a.scheduledAt || 0) - (b.scheduledAt || 0))[0];
           if (nextItem.scheduledAt && nextItem.scheduledAt > now) {
             const diff = Math.ceil((nextItem.scheduledAt - now) / 1000);
             addLog(`🕒 Đợi bài tiếp theo: ${diff}s nữa...`);
           }
        }

        const toNotify = scheduledItems.filter(item => 
          item.scheduledAt! <= now &&
          !notifiedSet.has(item.id)
        );

        if (toNotify.length === 0) return;

        for (const item of toNotify) {
          addLog(`📪 Đang gửi Tele cho bài: ${item.title.substring(0, 20)}...`);
          
          try {
            const resp = await fetch('/api/telegram/remind', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId, item })
            });

            if (resp.ok) {
              notifiedSet.add(item.id);
              localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(notifiedSet)));
              addLog(`✅ Thành công: ${item.title.substring(0, 20)}`);
            } else {
              const err = await resp.json();
              addLog(`❌ Lỗi API: ${err.error || 'Unknown'}`);
            }
          } catch (error: any) {
            addLog(`❌ Lỗi kết nối: ${error.message}`);
          }
        }
      } finally {
        isChecking.current = false;
      }
    };

    // Thêm listener để clear notifiedIds khi có bài mới cập nhật scheduledAt
    const syncNotifiedList = async () => {
      try {
        const items = await getContent();
        const stored = localStorage.getItem(NOTIFIED_KEY);
        if (!stored) return;
        let notifiedIds: string[] = JSON.parse(stored);
        const initialCount = notifiedIds.length;
        
        notifiedIds = notifiedIds.filter(id => {
          const item = items.find(i => i.id === id);
          if (!item) return false; 
          // Nếu bài viết được dời lịch vào tương lai (> 2 phút từ bây giờ), cho phép nó được thông báo lại
          if (item.status === 'scheduled' && item.scheduledAt && item.scheduledAt > (Date.now() + 120000)) return false;
          return true;
        });

        if (notifiedIds.length !== initialCount) {
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedIds));
        }
      } catch (e) {}
    };

    check();
    const interval = setInterval(check, 10000); // Kiểm tra mỗi 10 giây cho nhạy
    const syncInterval = setInterval(syncNotifiedList, 30000); // 30s đồng bộ 1 lần

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, []);

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
        <button onClick={() => setLogs(['🔄 Refresh logs...'])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>×</button>
      </div>
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
      <style jsx>{`
        .pulse-dot {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
}
