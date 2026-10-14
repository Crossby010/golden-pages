import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, type ToastType } from './toast-context';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

const TOAST_STYLES: Record<
  ToastType,
  { icon: typeof CheckCircle; accent: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    accent: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  error: {
    icon: AlertCircle,
    accent: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  info: {
    icon: Info,
    accent: 'text-brass-600',
    bg: 'bg-cream border-brass-200',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => toast(message, 'success', duration),
    [toast]
  );
  const error = useCallback(
    (message: string, duration?: number) => toast(message, 'error', duration),
    [toast]
  );
  const info = useCallback(
    (message: string, duration?: number) => toast(message, 'info', duration),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-20 right-4 sm:right-6 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type];
            const Icon = style.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
                  style.bg
                )}
              >
                <Icon
                  className={cn('w-5 h-5 flex-shrink-0 mt-0.5', style.accent)}
                />
                <p className="flex-1 text-sm text-navy-700 leading-relaxed">
                  {t.message}
                </p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
