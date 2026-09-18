import React from 'react';
import { useToastStore } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-slate-900 text-white';
        let borderColor = 'border-slate-700';

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-600 text-white';
          borderColor = 'border-emerald-500';
        } else if (toast.type === 'error') {
          bgColor = 'bg-rose-600 text-white';
          borderColor = 'border-rose-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} transition-all transform ease-out duration-300 animate-in fade-in slide-in-from-top-2`}
          >
            <div className="text-sm font-medium pr-3">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white text-base leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};