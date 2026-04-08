'use client';

import React from 'react';
import { ExternalLink, FolderOpen, FileText, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';

interface MediaPreviewProps {
  url: string;
}

export default function MediaPreview({ url }: MediaPreviewProps) {
  if (!url) return null;

  const getDriveType = (url: string): { type: 'file' | 'folder' | 'other'; id: string | null } => {
    try {
      if (url.includes('drive.google.com')) {
        // Folder check
        if (url.includes('/folders/')) {
          const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
          return { type: 'folder', id: match ? match[1] : null };
        }
        // File check
        if (url.includes('/file/d/')) {
          const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          return { type: 'file', id: match ? match[1] : null };
        }
        // Open/id link
        if (url.includes('id=')) {
          const urlObj = new URL(url);
          const id = urlObj.searchParams.get('id');
          // Rough way to guess if it's a folder, search usually folder IDs are longer or different? 
          // Actually open?id= works for both. Default to file if not sure.
          return { type: 'file', id };
        }
      }
      return { type: 'other', id: null };
    } catch (e) {
      return { type: 'other', id: null };
    }
  };

  const { type, id } = getDriveType(url);

  if (type === 'other' || !id) {
    return (
      <div className="glass" style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
        <ExternalLink size={16} />
        <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url}
        </a>
      </div>
    );
  }

  const embedUrl = type === 'file' 
    ? `https://drive.google.com/file/d/${id}/preview`
    : `https://drive.google.com/embeddedfolderview?id=${id}#grid`;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          {type === 'folder' ? <FolderOpen size={14} /> : <FileText size={14} />}
          Drive {type === 'folder' ? 'Folder' : 'File'} Preview
        </span>
        <a href={url} target="_blank" rel="noreferrer" title="Mở trong tab mới" style={{ color: 'var(--text-secondary)' }}>
          <ExternalLink size={14} />
        </a>
      </div>
      
      <div className="glass" style={{ 
        position: 'relative', 
        width: '100%', 
        paddingBottom: type === 'folder' ? '60%' : '56.25%', // 16:9 for files, slightly taller for folders
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <iframe
          src={embedUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="autoplay"
        />
      </div>
      
      <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <AlertCircle size={14} color="var(--accent-primary)" />
        <span>Nếu không thấy nội dung, hãy đảm bảo link ở chế độ <b>Bất kỳ ai cũng có thể xem</b>.</span>
      </div>
    </div>
  );
}
