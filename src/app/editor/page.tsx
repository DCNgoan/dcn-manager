'use client';

import React, { useState, useEffect } from 'react';
import { getAccounts, type Account, type Platform } from '@/lib/accounts';
import { saveContent, type ContentStatus } from '@/lib/content';
import { generateAIContent } from '@/lib/gemini';
import { generateOpenAIContent } from '@/lib/openai';
import { generateGroqContent } from '@/lib/groq';
import MediaPreview from '@/components/MediaPreview';
import { Save, Calendar, Link as LinkIcon, AlertCircle, CheckCircle2, Sparkles, Loader2, Zap, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { getContentItem, updateContent } from '@/lib/content';

export default function EditorPage() {
  const { userMetadata } = useAuth();
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    platform: 'tiktok' as Platform,
    accountId: '',
    mediaUrl: '',
    status: 'scheduled' as ContentStatus,
    scheduledAt: ''
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const editingId = searchParams.get('id');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'openai' | 'groq'>('gemini');
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!userMetadata) return;

    const fetchAccounts = async () => {
      const accs = await getAccounts(userMetadata.uid);
      setAccounts(accs);
      
      // Seed accountId if not editing or if freshly loaded
      if (accs.length > 0 && !formData.accountId && !editingId) {
        const firstMatch = accs.find(a => a.platform === formData.platform);
        if (firstMatch) setFormData(prev => ({ ...prev, accountId: firstMatch.id }));
      }
    };

    const fetchEditingItem = async () => {
      if (!editingId) return;
      try {
        const item = await getContentItem(editingId);
        if (item) {
          setFormData({
            title: item.title,
            body: item.body,
            platform: item.platform,
            accountId: item.accountId,
            mediaUrl: item.mediaUrl || '',
            status: item.status,
            scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : ''
          });
        }
      } catch (err) {
        console.error("Error loading item for edit:", err);
        setMessage({ type: 'error', text: 'Không thể tải bài viết để chỉnh sửa.' });
      }
    };

    fetchAccounts();
    fetchEditingItem();
  }, [formData.platform, userMetadata, editingId]);

  if (!mounted) return null;

  const platformLimits = {
    tiktok: 2200,
    facebook: 5000, // Practical limit for readability
    threads: 500,
    other: 10000
  };

  const currentLimit = platformLimits[formData.platform] || 2200;
  const isOverLimit = formData.body.length > currentLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body || !formData.accountId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    setIsSaving(true);
    try {
      if (!userMetadata) throw new Error("Chưa đăng nhập");
      
      const contentPayload = {
        title: formData.title,
        body: formData.body,
        platform: formData.platform,
        accountId: formData.accountId,
        mediaUrl: formData.mediaUrl,
        status: formData.status,
        scheduledAt: formData.scheduledAt 
          ? new Date(formData.scheduledAt).getTime() 
          : Date.now(), // Default to now if no date selected
        userId: userMetadata?.uid || ''
      };

      if (editingId) {
        await updateContent(editingId, contentPayload);
        toast.success('Hệ thống: Đã cập nhật xong bài viết!');
      } else {
        await saveContent(contentPayload);
        toast.success('Hệ thống: Đã lên lịch thành công!');
        setFormData({
          title: '',
          body: '',
          platform: 'tiktok',
          accountId: '',
          mediaUrl: '',
          status: 'scheduled',
          scheduledAt: ''
        });
      }
      
      if (editingId) {
        setTimeout(() => router.push('/library'), 1000);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu bài.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!formData.title) {
      toast.error('Please enter a Topic in the Title field first.');
      return;
    }

    setIsAiLoading(true);
    try {
      let result = '';
      let usedModel = aiModel;

      try {
        if (!userMetadata) throw new Error("Chưa đăng nhập");
        result = aiModel === 'gemini' 
          ? await generateAIContent(formData.title, formData.platform, userMetadata.uid)
          : aiModel === 'openai'
            ? await generateOpenAIContent(formData.title, formData.platform, userMetadata.uid)
            : await generateGroqContent(formData.title, formData.platform, userMetadata.uid);
      } catch (firstErr: any) {
        // Fallback logic for quota errors
        console.warn('First AI attempt failed, trying fallback...', firstErr);
        const isQuotaError = firstErr.message?.toLowerCase().includes('quota') || 
                            firstErr.message?.toLowerCase().includes('excessive');
        
        if (isQuotaError) {
          // Priority fallback sequence: Gemini -> OpenAI -> Groq
          let fallbackModel: 'gemini' | 'openai' | 'groq' = 'openai';
          if (aiModel === 'openai') fallbackModel = 'groq';
          if (aiModel === 'groq') fallbackModel = 'gemini';
          
          toast.error(`${aiModel.toUpperCase()} đang gặp lỗi, đang thử dự phòng bằng ${fallbackModel.toUpperCase()}...`);
          
          result = fallbackModel === 'gemini'
            ? await generateAIContent(formData.title, formData.platform, userMetadata?.uid || '')
            : fallbackModel === 'openai'
              ? await generateOpenAIContent(formData.title, formData.platform, userMetadata?.uid || '')
              : await generateGroqContent(formData.title, formData.platform, userMetadata?.uid || '');
          
          usedModel = fallbackModel;
          setAiModel(fallbackModel);
        } else {
          throw firstErr; // Rethrow if it's not a quota error
        }
      }
      
      setFormData(prev => ({ ...prev, body: result }));
      toast.success(`AI (${usedModel === 'gemini' ? 'Gemini' : 'ChatGPT'}) đã tạo nội dung thành công!`);
    } catch (err: any) {
      let friendlyError = err.message || 'AI không thể tạo nội dung lúc này.';
      if (friendlyError.includes('quota')) {
        friendlyError = 'Cả 2 AI đều đang hết hạn mức miễn phí. Vui lòng thử lại sau 1 phút hoặc kiểm tra số dư tài khoản.';
      }
      toast.error(friendlyError);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(a => a.platform === formData.platform);

  return (
    <div className="responsive-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header className="responsive-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 className="heading-font responsive-title" style={{ fontWeight: 700 }}>
          {editingId ? 'Chỉnh sửa Nội dung' : 'Soạn thảo Nội dung'}
        </h1>
        <p className="responsive-subtitle" style={{ color: 'var(--text-secondary)' }}>
          {editingId ? 'Cập nhật lại bài viết viral của bạn.' : 'Sáng tạo và lên lịch các bài viết viral của bạn.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="responsive-grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Main Editor */}
          <div className="glass glass-card" style={{ padding: 'var(--spacing-xl)' }}>
            <input 
              type="text" 
              placeholder="Tiêu đề bài viết..."
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', fontWeight: 700, background: 'transparent', border: 'none', color: 'white', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}
              className="heading-font responsive-editor-title"
            />
            
            <div className="ai-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={18} color={aiModel === 'gemini' ? 'var(--accent-primary)' : '#10a37f'} />
                <span className="hidden-mobile" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Công cụ AI:</span>
                <select 
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value as 'gemini' | 'openai' | 'groq')}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    backgroundColor: 'var(--bg-primary)', 
                    color: 'white',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '140px'
                  }}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">ChatGPT API</option>
                  <option value="groq">Groq (Nhanh)</option>
                </select>
              </div>
              
              <button 
                type="button" 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="ai-gen-btn"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px', 
                  padding: '10px 24px', 
                  borderRadius: '10px', 
                  backgroundColor: aiModel === 'gemini' ? 'var(--accent-primary)' : aiModel === 'openai' ? '#10a37f' : '#f55036', 
                  color: 'white',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: isAiLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isAiLoading ? 'AI đang viết...' : '✨ Viết bài ngay'}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea 
                placeholder="Bạn đang nghĩ gì? (Nội dung bài đăng...)"
                value={formData.body}
                onChange={e => setFormData({...formData, body: e.target.value})}
                style={{ width: '100%', minHeight: '300px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.1rem', lineHeight: '1.6', resize: 'vertical' }}
              />
              <div style={{ 
                position: 'absolute', 
                bottom: '-20px', 
                right: '0', 
                fontSize: '0.8rem', 
                color: isOverLimit ? 'var(--color-tiktok-pink)' : 'var(--text-secondary)' 
              }}>
                {formData.body.length} / {currentLimit} ký tự
              </div>
            </div>
          </div>

          <div className="glass glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <h3 className="heading-font" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LinkIcon size={18} /> Tài nguyên Media
            </h3>
            <input 
              type="url" 
              placeholder="Link Google Drive / Dropbox"
              value={formData.mediaUrl}
              onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dán link chứa video hoặc hình ảnh minh họa của bạn vào đây.</p>
            
            {formData.mediaUrl && (
              <div style={{ marginTop: '16px' }}>
                <MediaPreview url={formData.mediaUrl} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="glass glass-card">
            <h3 className="heading-font" style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Thông tin Xuất bản</h3>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nền tảng</label>
              <select 
                value={formData.platform}
                onChange={e => setFormData({...formData, platform: e.target.value as Platform, accountId: ''})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-tertiary)', color: 'white', outline: 'none' }}
              >
                <option value="tiktok" style={{ backgroundColor: 'var(--bg-primary)' }}>TikTok</option>
                <option value="facebook" style={{ backgroundColor: 'var(--bg-primary)' }}>Facebook</option>
                <option value="threads" style={{ backgroundColor: 'var(--bg-primary)' }}>Threads</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tài khoản</label>
              <select 
                value={formData.accountId}
                onChange={e => setFormData({...formData, accountId: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-tertiary)', color: 'white', outline: 'none' }}
                disabled={filteredAccounts.length === 0}
              >
                <option value="" style={{ backgroundColor: 'var(--bg-primary)' }}>Chọn tài khoản</option>
                {filteredAccounts.map(acc => (
                  <option key={acc.id} value={acc.id} style={{ backgroundColor: 'var(--bg-primary)' }}>{acc.name}</option>
                ))}
              </select>
              {filteredAccounts.length === 0 && (
                <p style={{ color: 'var(--color-tiktok-pink)', fontSize: '0.7rem', marginTop: '4px' }}>Chưa có acc cho nền tảng này.</p>
              )}
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ngày đăng lịch</label>
              <input 
                type="datetime-local" 
                value={formData.scheduledAt}
                onChange={e => setFormData({...formData, scheduledAt: e.target.value, status: 'scheduled'})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-tertiary)', color: 'white' }}
              />
            </div>
          </div>

            <button 
              type="submit"
              disabled={isSaving}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '12px', 
                backgroundColor: isSaving ? 'var(--text-secondary)' : 'var(--accent-primary)', 
                color: 'white', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? <Edit3 size={18} /> : <Calendar size={18} />)}
              {isSaving ? 'Đang lưu...' : (editingId ? 'Cập nhật nội dung' : 'Lên lịch đăng bài')}
            </button>
        </div>
      </form>
    </div>
  );
}
