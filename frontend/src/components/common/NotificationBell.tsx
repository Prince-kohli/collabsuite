import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useToastStore } from '../../store/useToastStore';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteOne,
    deleteMany,
    clearAll,
    initSocketListeners,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    initSocketListeners();
  }, [fetchNotifications, initSocketListeners]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleNotificationClick = async (id: string, link?: string, isRead?: boolean) => {
    if (isSelectionMode) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
      return;
    }
    if (!isRead) await markAsRead(id);
    setIsOpen(false);
    if (link) navigate(link);
  };

  const handleClearOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteOne(id);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch {
      showToast('Failed to remove notification', 'error');
    }
  };

  const handleClearSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await deleteMany(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
      showToast('Selected notifications cleared', 'info');
    } catch {
      showToast('Failed to clear selected', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
      setSelectedIds([]);
      setIsSelectionMode(false);
      showToast('All notifications cleared', 'info');
    } catch {
      showToast('Failed to clear all', 'error');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode((v) => !v);
                  setSelectedIds([]);
                }}
                className="text-[11px] text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer"
              >
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 && !isSelectionMode && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              )}

              {isSelectionMode ? (
                <button
                  type="button"
                  onClick={handleClearSelected}
                  disabled={selectedIds.length === 0}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer disabled:opacity-40"
                >
                  Clear selected ({selectedIds.length})
                </button>
              ) : (
                notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear all
                  </button>
                )
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((item) => {
                const isSelected = selectedIds.includes(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item._id, item.link, item.isRead)}
                    className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-50 flex gap-2 items-start ${
                      !item.isRead ? 'bg-indigo-50/40' : ''
                    } ${isSelected ? 'bg-indigo-50' : ''}`}
                  >
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => toggleSelect(item._id, e)}
                        className="mt-1 cursor-pointer accent-indigo-600"
                      />
                    )}

                    {!isSelectionMode && (
                      <div
                        className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"
                        style={{ opacity: item.isRead ? 0 : 1 }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 leading-snug">{item.title}</p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">{item.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      {item.link && !isSelectionMode && (
                        <span className="text-[10px] text-indigo-500 font-medium">Open →</span>
                      )}
                    </div>

                    {!isSelectionMode && (
                      <button
                        type="button"
                        title="Clear this notification"
                        onClick={(e) => handleClearOne(item._id, e)}
                        className="shrink-0 p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};