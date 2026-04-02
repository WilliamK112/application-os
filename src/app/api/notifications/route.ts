import { NextResponse } from "next/server";
import { authSession } from "@/lib/auth/session-adapter";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/notifications/notification-service-ex";

/**
 * GET /api/notifications
 * Returns paginated notifications for the current user.
 *
 * Query params:
 *   limit  — number of items (default 20, max 50)
 *   offset — pagination offset (default 0)
 */
export async function GET(request: Request) {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { notifications, total } = await getNotifications(session.user.id, { limit, offset });

  return NextResponse.json({ notifications, total, limit, offset });
}

/**
 * PATCH /api/notifications
 * Mark one or all notifications as read.
 *
 * Body: { id: string }          — mark single notification as read
 *    or { all: true }          — mark all as read
 */
export async function PATCH(request: Request) {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.id) {
    await markAsRead(body.id, session.user.id);
    return NextResponse.json({ ok: true });
  }

  if (body.all === true) {
    await markAllAsRead(session.user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide id or all:true" }, { status: 400 });
}

/**
 * DELETE /api/notifications
 * Delete a notification.
 *
 * Body: { id: string }
 */
export async function DELETE(request: Request) {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteNotification(body.id, session.user.id);
  return NextResponse.json({ ok: true });
}
