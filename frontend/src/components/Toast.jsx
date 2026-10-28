import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      progress: 'bg-emerald-500'
    },
    error: {
      icon: AlertCircle,
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      iconColor: 'text-rose-600',
      progress: 'bg-rose-500'
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      iconColor: 'text-amber-600',
      progress: 'bg-amber-500'
    },
    info: {
      icon: Info,
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      iconColor: 'text-blue-600',
      progress: 'bg-blue-500'
    }
  };

  const config = typeConfig[toast.type || 'info'];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className={`p-4 rounded-2xl border shadow-xl ${config.bg} ${config.border} backdrop-blur-md relative overflow-hidden flex items-start gap-3`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 pr-2">
          {toast.title && <h5 className={`text-xs font-bold ${config.text}`}>{toast.title}</h5>}
          <p className={`text-xs font-medium leading-relaxed ${config.text} mt-0.5`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;

