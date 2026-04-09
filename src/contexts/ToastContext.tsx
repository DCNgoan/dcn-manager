'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((msg: string) => show(msg, 'success'), [show]);
  const error = useCallback((msg: string) => show(msg, 'error'), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass"
            style={{
              pointerEvents: 'auto',
              minWidth: '200px',
              padding: '12px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(37, 244, 238, 0.3)' : 'rgba(254, 44, 85, 0.3)'}`,
              animation: 'toastInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              backgroundColor: 'rgba(26, 27, 38, 0.8)'
            }}
          >
            <div style={{ color: toast.type === 'success' ? 'var(--color-tiktok-cyan)' : 'var(--color-tiktok-pink)' }}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'white' }}>{toast.message || (toast.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra')}</span>
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{ padding: '4px', opacity: 0.5, marginLeft: 'auto' }}
            >
              <X size={14} color="white" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
