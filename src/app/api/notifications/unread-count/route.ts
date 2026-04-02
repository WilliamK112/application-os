import { NextResponse } from "next/server";
import { authSession } from "@/lib/auth/session-adapter";
import { getUnreadCount } from "@/lib/notifications/notification-service-ex";

/** GET /api/notifications/unread-count — returns { count } */
export async function GET() {
  const session = await authSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getUnreadCount(session.user.id);
  return NextResponse.json({ count });
}
