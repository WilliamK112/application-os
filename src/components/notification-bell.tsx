"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  /** ClassName forwarded to the button wrapper */
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30 seconds while dropdown is open
  useEffect(() => {
    if (open) {
      void fetchNotifications();
      void fetchUnread();
      pollInterval.current = setInterval(() => {
        void fetchUnread();
      }, 30_000);
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [open, fetchNotifications, fetchUnread]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Mark single as read
  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  // Delete a notification
  const deleteNotification = async (id: string, wasUnread: boolean) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const typeIcon: Record<string, string> = {
    INTERVIEW_REMINDER: "📅",
    FOLLOW_UP_REMINDER: "⏰",
    APPLICATION_UPDATE: "💼",
    AUTO_APPLY_COMPLETE: "✅",
    AUTO_APPLY_FAILED: "❌",
    INFO: "ℹ️",
    SUCCESS: "✔️",
    WARNING: "⚠️",
    ERROR: "🚫",
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M9.52 4.429A4 4 0 0 1 12 3a4 4 0 0 1 2.48.429l1.515-1.32a.534.534 0 0 1 .832.002l1.268 1.54a.75.75 0 0 1-.002.966L15.6 6.32a4 4 0 0 1-6.2.002l-1.293-1.576a.75.75 0 0 1-.002-.966l1.268-1.54a.534.534 0 0 1 .832-.002L9.52 4.429ZM10.5 20a1.5 1.5 0 0 1 1.493-1.356L12 18.75l.007.144A1.5 1.5 0 0 1 13.5 20v1.276a1.5 1.5 0 0 1-.866.276h-4a1.5 1.5 0 0 1-.866-.276V20a1.5 1.5 0 0 1 1.356-1.493Z"
            clipRule="evenodd"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-400">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-slate-400">
                <span>🔔</span>
                <span>No notifications yet</span>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const isUnread = !n.readAt;
                  return (
                    <li
                      key={n.id}
                      className={`group relative flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 ${
                        isUnread ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {/* Icon */}
                      <span className="mt-0.5 shrink-0 text-base">{typeIcon[n.type] ?? "ℹ️"}</span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {n.link ? (
                          <a
                            href={n.link}
                            onClick={() => {
                              if (isUnread) void markAsRead(n.id);
                              setOpen(false);
                            }}
                            className="block"
                          >
                            <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs leading-snug text-slate-500">{n.body}</p>
                          </a>
                        ) : (
                          <div>
                            <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs leading-snug text-slate-500">{n.body}</p>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400">{formatTime(n.createdAt)}</p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteNotification(n.id, isUnread);
                        }}
                        className="mt-0.5 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
                        aria-label="Delete notification"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2">
              <a
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
