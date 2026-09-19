import React from 'react';
import { useToastStore, type ToastType } from '../../store/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          barColor: 'bg-emerald-500',
          borderColor: 'border-emerald-100',
        };
      case 'error':
        return {
          icon: (
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          barColor: 'bg-rose-500',
          borderColor: 'border-rose-100',
        };
      default:
        return {
          icon: (
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          barColor: 'bg-indigo-500',
          borderColor: 'border-indigo-100',
        };
    }
  };

  return (
    <>
      {/* Inline Keyframe Style for Smooth Progress Bar */}
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress {
          animation: toastProgress 4000ms linear forwards;
        }
      `}</style>

      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex items-center justify-between p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border ${config.borderColor} transition-all duration-300 animate-in fade-in slide-in-from-top-3 overflow-hidden group`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {config.icon}
                <p className="text-xs font-semibold text-slate-800 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Animated Bottom Progress Timer Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden rounded-b-2xl">
                <div className={`h-full ${config.barColor} animate-toast-progress`} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};