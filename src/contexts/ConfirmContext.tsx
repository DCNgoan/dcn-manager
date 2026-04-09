'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info' | 'success';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({ isOpen: true, options, resolve });
    });
  };

  const handleConfirm = () => {
    if (modal) {
      modal.resolve(true);
      setModal(null);
    }
  };

  const handleCancel = () => {
    if (modal) {
      modal.resolve(false);
      setModal(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {modal?.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass" style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: modal.options.type === 'danger' ? 'rgba(254, 44, 85, 0.15)' : 'rgba(37, 244, 238, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: `1px solid ${modal.options.type === 'danger' ? 'var(--color-tiktok-pink)' : 'var(--color-tiktok-cyan)'}`
              }}>
                {modal.options.type === 'danger' ? (
                  <AlertTriangle size={32} color="var(--color-tiktok-pink)" />
                ) : modal.options.type === 'success' ? (
                  <CheckCircle2 size={32} color="var(--color-tiktok-cyan)" />
                ) : (
                  <Info size={32} color="var(--color-tiktok-cyan)" />
                )}
              </div>
              <h3 className="heading-font" style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'white' }}>
                {modal.options.title || 'Thông báo xác nhận'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                {modal.options.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCancel}
                className="glass"
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                {modal.options.cancelLabel || 'Hủy bỏ'}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: modal.options.type === 'danger' ? 'var(--color-tiktok-pink)' : 'var(--accent-primary)',
                  boxShadow: `0 4px 15px ${modal.options.type === 'danger' ? 'rgba(254, 44, 85, 0.3)' : 'rgba(37, 244, 238, 0.3)'}`,
                  transition: 'all 0.2s'
                }}
              >
                {modal.options.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
