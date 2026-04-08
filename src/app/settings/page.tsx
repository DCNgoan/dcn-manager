'use client';

import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, type AppSettings } from '@/lib/settings';
import { Save, Key, ShieldCheck, Info, ExternalLink, CheckCircle2, Zap, Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    geminiKey: '',
    openaiKey: '',
    groqKey: '',
    facebookToken: '',
    tiktokToken: '',
    threadsToken: '',
    telegramToken: '',
    telegramChatId: '',
    autoDeleteDays: 20
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchSettings = async () => {
      const data = await getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    };
    fetchSettings();
  }, []);

  if (!mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings(settings);
      
      // Automatically setup webhook using current origin if Telegram is configured
      if (settings.telegramToken) {
        const webhookUrl = window.location.origin;
        await fetch('/api/telegram/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl, token: settings.telegramToken })
        });
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error: any) {
      alert('Lỗi lưu cấu hình: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!settings.telegramChatId) {
      alert('Vui lòng nhập Chat ID trước!');
      return;
    }
    setIsTesting(true);
    try {
      const resp = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: settings.telegramChatId, token: settings.telegramToken })
      });
      const data = await resp.json();
      if (data.success) {
        alert('Bot đã gửi tin nhắn thử nghiệm đến Telegram của bạn!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      alert('Không thể kết nối với hệ thống.');
    } finally {
      setIsTesting(false);
    }
  };


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="heading-font" style={{ fontSize: '2rem', fontWeight: 700 }}>Cài đặt & Tích hợp</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Quản lý các mã API và thông tin bảo mật của bạn.</p>
      </header>

      <div className="glass glass-card" style={{ marginBottom: 'var(--spacing-xl)', borderLeft: '4px solid var(--accent-secondary)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldCheck size={20} color="var(--accent-secondary)" />
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px' }}>Lưu ý về Bảo mật</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Mã API của bạn được lưu trữ **an toàn trên đám mây Firebase Cloud Firestore**. Bạn có thể truy cập và sử dụng cấu hình này từ bất kỳ đâu. Tuyệt đối không chia sẻ mã này cho người lạ.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
        {/* Telegram Config */}
        <section className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '20px', border: '1px solid rgba(0, 136, 204, 0.3)' }}>
          <h2 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" width="20" height="20" alt="Telegram" /> 
            Thông báo Telegram Bot
          </h2>
          <div style={{ backgroundColor: 'rgba(0, 136, 204, 0.05)', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 600, color: '#0088cc', marginBottom: '4px' }}>Cách kết nối Bot:</p>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              <li>Chat với <b>@BotFather</b> trên Telegram để tạo Bot và lấy <b>API Token</b>.</li>
              <li>Gửi tin nhắn <b>/start</b> cho Bot vừa tạo.</li>
              <li>
                Nhập Token vào ô dưới, sau đó {settings.telegramToken ? (
                  <a 
                    href={`https://api.telegram.org/bot${settings.telegramToken}/getUpdates`} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: '#0088cc', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Click vào đây để tìm Chat ID
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Dán Token để hiện link lấy Chat ID</span>
                )}
              </li>
            </ol>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mã Bot Token (Lấy từ @BotFather):</label>
              <input 
                type="password" 
                placeholder="Dán mã Token (ví dụ: 123456:ABC...)"
                value={settings.telegramToken || ''}
                onChange={e => setSettings({...settings, telegramToken: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--glass-border)', 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  color: 'white' 
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Telegram Chat ID:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Ví dụ: 123456789"
                  value={settings.telegramChatId || ''}
                  onChange={e => setSettings({...settings, telegramChatId: e.target.value})}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: settings.telegramChatId?.includes(':') ? '1px solid var(--color-tiktok-pink)' : '1px solid var(--glass-border)', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    color: 'white' 
                  }}
                />
                <button 
                  type="button"
                  onClick={testTelegram}
                  disabled={isTesting || !settings.telegramToken || !settings.telegramChatId}
                  style={{ padding: '0 20px', borderRadius: '10px', backgroundColor: 'rgba(0, 136, 204, 0.2)', color: '#0088cc', border: '1px solid rgba(0, 136, 204, 0.3)', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {isTesting ? 'Đang gửi...' : 'Test Connection'}
                </button>
              </div>
            </div>
          </div>

        </section>

        {/* Gemini API Key */}
        <section className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '20px' }}>
          <h2 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={20} color="var(--accent-primary)" /> Google Gemini API
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Dùng để tự động tạo nội dung và lên ý tưởng bằng AI. 
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ marginLeft: '6px', color: 'var(--accent-primary)', textDecoration: 'underline' }}>Lấy mã miễn phí tại đây</a>.
          </p>
          <input 
            type="password" 
            placeholder="Dán mã Gemini API Key vào đây"
            value={settings.geminiKey}
            onChange={e => setSettings({...settings, geminiKey: e.target.value})}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white' }}
          />
        </section>

        {/* OpenAI API Key */}
        <section className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '20px' }}>
          <h2 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={20} color="#10a37f" /> OpenAI ChatGPT API
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Dùng ChatGPT (GPT-4o mini) để viết nội dung bài đăng. 
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ marginLeft: '6px', color: '#10a37f', textDecoration: 'underline' }}>Lấy mã tại OpenAI Platform</a>.
          </p>
          <input 
            type="password" 
            placeholder="Dán OpenAI API Key (sk-...) vào đây"
            value={settings.openaiKey}
            onChange={e => setSettings({...settings, openaiKey: e.target.value})}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white' }}
          />
        </section>

        {/* Groq API Key */}
        <section className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '20px', borderLeft: '4px solid #f55036' }}>
          <h2 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} color="#f55036" /> Groq AI (Llama 3 - Cực nhanh & Miễn phí)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Phương án dự phòng tốt nhất khi GPT/Gemini bị lỗi. Tốc độ cực nhanh.
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ marginLeft: '6px', color: '#f55036', textDecoration: 'underline' }}>Lấy mã Groq Key miễn phí tại đây</a>.
          </p>
          <input 
            type="password" 
            placeholder="Dán Groq API Key (gsk_...) vào đây"
            value={settings.groqKey || ''}
            onChange={e => setSettings({...settings, groqKey: e.target.value})}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white' }}
          />
        </section>


        {/* Data Management */}
        <section className="glass" style={{ padding: 'var(--spacing-lg)', borderRadius: '20px', borderLeft: '4px solid #94a3b8' }}>
          <h2 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trash2 size={20} color="#94a3b8" /> Quản lý Dữ liệu & Tự động dọn dẹp
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Hệ thống sẽ tự động xóa các bài viết ở trạng thái <b>"Đã đăng"</b> sau số ngày bạn cài đặt dưới đây để bảo mật dữ liệu.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem' }}>Tự động xóa sau:</span>
            <input 
              type="number" 
              min="1"
              max="365"
              value={settings.autoDeleteDays || 20}
              onChange={e => setSettings({...settings, autoDeleteDays: parseInt(e.target.value) || 0})}
              style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'white', textAlign: 'center' }}
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ngày kể từ khi xác nhận đã đăng.</span>
          </div>
        </section>

        <button 
          type="submit"
          disabled={isSaving}
          style={{ 
            padding: '16px', 
            borderRadius: '16px', 
            backgroundColor: isSaved ? '#22c55e' : (isSaving ? 'var(--text-secondary)' : 'var(--accent-primary)'), 
            color: 'white', 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            border: 'none',
            width: '100%'
          }}
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : (isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />)}
          {isSaving ? 'Đang lưu cấu hình...' : (isSaved ? 'Đã lưu thành công!' : 'Lưu cấu hình bảo mật')}
        </button>
      </form>
    </div>
  );
}
