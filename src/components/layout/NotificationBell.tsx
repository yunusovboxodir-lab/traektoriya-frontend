import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notificationStore';
import type { AppNotification } from '../../api/notifications';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

const TYPE_ICON: Record<string, string> = {
  task_assigned: '📋',
  task_reassigned: '🔄',
  learning_assigned: '📚',
  morning_briefing: '☀️',
  learning_reminder: '📖',
  weekly_digest: '📊',
  system: 'ℹ️',
};

// ─── Bell SVG icon ───────────────────────────────────────────────────────────

function IconBell({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconX({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── NotificationItem ────────────────────────────────────────────────────────

function NotificationItem({
  n,
  onRead,
  onRemove,
  onNavigate,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    const navTarget =
      (n.related_type === 'task' && n.related_id) || n.type === 'task_assigned' || n.type === 'task_reassigned' || n.type === 'morning_briefing'
        ? '/tasks'
        : n.type === 'learning_assigned' || n.type === 'learning_reminder'
          ? '/learning'
          : n.type === 'weekly_digest'
            ? '/kpi'
            : null;
    if (navTarget) {
      navigate(navTarget);
      onNavigate();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
        hover:bg-gray-50 border-b border-gray-100 last:border-0
        ${!n.is_read ? 'bg-blue-50/40' : ''}
      `}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">
        {TYPE_ICON[n.type] ?? '🔔'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(n.id); }}
          className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
          title="Удалить"
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}

// ─── NotificationBell ────────────────────────────────────────────────────────

interface NotificationBellProps {
  /** Mobile mode: uses dark icon (for white header bg) */
  mobile?: boolean;
}

export function NotificationBell({ mobile = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, fetch, markRead, markAllRead, remove } =
    useNotificationStore();

  // Initial fetch + polling every 60s
  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 60_000);
    return () => clearInterval(timer);
  }, [fetch]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const iconColor = mobile ? 'text-gray-600 hover:text-gray-900' : 'text-gray-300 hover:text-white';

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative p-1.5 rounded-md transition-colors ${iconColor}`}
        title="Уведомления"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900">
              Уведомления
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <IconBell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onRead={markRead}
                  onRemove={remove}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
