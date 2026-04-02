/**
 * In-app + push notification helpers.
 * Called by existing reminder services and auto-apply worker.
 */

import { prisma } from "@/lib/db";
import { sendPushToUser, PushPayload } from "./push-service";
import type { NotificationType } from "@prisma/client";

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  sendPush?: boolean;
}

/**
 * Create an in-app notification and optionally send a Web Push notification.
 */
export async function createNotification(opts: CreateNotificationOptions): Promise<void> {
  const { userId, type, title, body, link, sendPush = true } = opts;

  // Save to DB
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  // Send push (fire-and-forget)
  if (sendPush) {
    const pushPayload: PushPayload = {
      title,
      body,
      icon: "/icons/icon-192.png",
      link: link ?? undefined,
      tag: `notif-${notification.id}`,
    };

    sendPushToUser(userId, pushPayload).catch((err) => {
      console.error("[notification] push failed:", err);
    });
  }
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/**
 * Delete a notification.
 */
export async function deleteNotification(id: string, userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { id, userId } });
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Get recent notifications for a user (paginated).
 */
export async function getNotifications(
  userId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, total };
}

// ── Convenience helpers for existing services ──────────────────────────────────

export async function notifyInterviewReminder(
  userId: string,
  data: { interviewType: string; scheduledAt: Date; location?: string; link: string },
): Promise<void> {
  await createNotification({
    userId,
    type: "INTERVIEW_REMINDER",
    title: `📅 Interview: ${data.interviewType}`,
    body: data.location ? `Tomorrow at ${data.location}` : `Scheduled for ${data.scheduledAt.toLocaleDateString()}`,
    link: data.link,
  });
}

export async function notifyFollowUpReminder(
  userId: string,
  data: { content?: string; dueAt: Date; link: string },
): Promise<void> {
  await createNotification({
    userId,
    type: "FOLLOW_UP_REMINDER",
    title: "⏰ Follow-up Reminder",
    body: data.content ?? "You have a follow-up due",
    link: data.link,
  });
}

export async function notifyApplicationUpdate(
  userId: string,
  data: { companyName: string; jobTitle: string; newStatus: string; link: string },
): Promise<void> {
  await createNotification({
    userId,
    type: "APPLICATION_UPDATE",
    title: `💼 ${data.companyName} — ${data.newStatus}`,
    body: data.jobTitle,
    link: data.link,
  });
}

export async function notifyAutoApplyComplete(
  userId: string,
  data: { companyName: string; jobTitle: string; applicationLink: string },
): Promise<void> {
  await createNotification({
    userId,
    type: "AUTO_APPLY_COMPLETE",
    title: `✅ Applied: ${data.companyName}`,
    body: data.jobTitle,
    link: data.applicationLink,
  });
}

export async function notifyAutoApplyFailed(
  userId: string,
  data: { companyName: string; jobTitle: string; reason: string; queueLink: string },
): Promise<void> {
  await createNotification({
    userId,
    type: "AUTO_APPLY_FAILED",
    title: `❌ Auto-apply failed: ${data.companyName}`,
    body: data.reason,
    link: data.queueLink,
  });
}
