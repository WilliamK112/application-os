"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { usePushNotifications } from "@/components/use-push-notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

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

const typeColor: Record<string, string> = {
  INTERVIEW_REMINDER: "border-l-blue-400 bg-blue-50/40",
  FOLLOW_UP_REMINDER: "border-l-amber-400 bg-amber-50/40",
  APPLICATION_UPDATE: "border-l-indigo-400 bg-indigo-50/40",
  AUTO_APPLY_COMPLETE: "border-l-green-400 bg-green-50/40",
  AUTO_APPLY_FAILED: "border-l-red-400 bg-red-50/40",
  INFO: "border-l-slate-400 bg-slate-50/40",
  SUCCESS: "border-l-green-400 bg-green-50/40",
  WARNING: "border-l-amber-400 bg-amber-50/40",
  ERROR: "border-l-red-400 bg-red-50/40",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const { supported, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  const fetchNotifications = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(page);
  }, [page, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
    );
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const deleteNotification = async (id: string) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => t - 1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-2xl">
        {/* Push subscription banner */}
        {supported && !subscribed && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div>
              <p className="text-sm font-medium text-blue-900">🔔 Enable push notifications</p>
              <p className="mt-0.5 text-xs text-blue-700">
                Get notified about interviews, follow-ups, and auto-apply results even when the app is closed.
              </p>
            </div>
            <button
              onClick={() => void subscribe()}
              disabled={pushLoading}
              className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pushLoading ? "Enabling…" : "Enable"}
            </button>
          </div>
        )}

        {supported && subscribed && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">🔔 Push notifications enabled</p>
            <button
              onClick={() => void unsubscribe()}
              disabled={pushLoading}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Disable
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {total === 0 ? "No notifications" : `${total} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-4" style={{ height: "80px" }} />
            ))
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-16 text-slate-400">
              <span className="text-4xl">🔔</span>
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">We&apos;ll notify you about interviews, follow-ups, and more.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  className={`group relative rounded-xl border border-slate-200 bg-white p-4 border-l-4 ${typeColor[n.type] ?? "border-l-slate-300"} ${isUnread ? "shadow-sm" : ""}`}
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 shrink-0 text-xl">{typeIcon[n.type] ?? "ℹ️"}</span>
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <a
                          href={n.link}
                          onClick={() => {
                            if (isUnread) void markAsRead(n.id);
                          }}
                          className="block"
                        >
                          <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                            {n.title}
                          </p>
                          <p className="mt-1 text-xs leading-snug text-slate-500">{n.body}</p>
                        </a>
                      ) : (
                        <>
                          <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                            {n.title}
                          </p>
                          <p className="mt-1 text-xs leading-snug text-slate-500">{n.body}</p>
                        </>
                      )}
                      <p className="mt-2 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => void deleteNotification(n.id)}
                      className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
                      aria-label="Delete notification"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
