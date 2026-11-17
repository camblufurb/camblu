import React, { createContext, useCallback, useContext, useState } from 'react';
import { Icon } from './Icon';

export type ToastTone = 'success' | 'info' | 'error';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  state: 'open' | 'closing';
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, state: 'closing' } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone, state: 'open' }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const iconMap: Record<ToastTone, string> = {
    success: 'check_circle',
    info: 'info',
    error: 'error',
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="m3-toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="m3-toast"
            data-tone={toast.tone}
            data-state={toast.state}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <Icon name={iconMap[toast.tone]} filled />
            <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: 560 }}>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dispensar aviso"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
