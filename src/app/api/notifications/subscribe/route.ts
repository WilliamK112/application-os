import { NextResponse } from "next/server";
import { authSession } from "@/lib/auth/session-adapter";
import {
  upsertPushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from "@/lib/notifications/push-service";

/**
 * POST /api/notifications/subscribe
 * Subscribe to Web Push notifications.
 *
 * Body: { subscription: { endpoint, keys: { p256dh, auth } } }
 *
 * Also returns { publicKey } needed by the client to set up push.
 */
export async function POST(request: Request) {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
  }

  await upsertPushSubscription(session.user.id, body.subscription);

  return NextResponse.json({
    ok: true,
    publicKey: getVapidPublicKey(),
  });
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe from Web Push notifications.
 *
 * Body: { endpoint: string }
 */
export async function DELETE(request: Request) {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await removePushSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
