/**
 * Web Push service using web-push library.
 * Requires VAPID keys — generate with: npx web-push generate-vapid-keys
 */

import webpush from "web-push";
import { prisma } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:no-reply@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  link?: string;
  tag?: string;
}

/**
 * Send a push notification to all active subscriptions for a user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; errors: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[push] VAPID keys not configured — skipping push");
    return { sent: 0, errors: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, errors: 0 };
  }

  const payloadStr = JSON.stringify({
    ...payload,
    icon: payload.icon ?? "/icons/icon-192.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr,
      ),
    ),
  );

  let sent = 0;
  let errors = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sub = subscriptions[i];

    if (result.status === "fulfilled") {
      sent++;
    } else {
      errors++;
      const status = (result as PromiseRejectedResult).reason?.statusCode;
      // 410 Gone = subscription expired, clean it up
      if (status === 410 || status === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        console.warn(`[push] removed expired subscription ${sub.id}`);
      } else {
        console.error(`[push] failed for ${sub.id}: ${result.reason?.message}`);
      }
    }
  }

  return { sent, errors };
}

/**
 * Save or update a push subscription for a user.
 */
export async function upsertPushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

/**
 * Remove a push subscription by endpoint.
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/** Expose VAPID public key for the client to use */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
