import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * INTERNAL endpoint — returns user ID by email.
 * Used by auto-apply-worker to resolve AUTO_APPLY_USER_ID at runtime.
 *
 * GET /api/internal/resolve-user?email=<email>
 * Header: x-auto-apply-secret: <AUTO_APPLY_WORKER_SECRET>
 *
 * Response: { userId: "cuid..." }
 */
export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-auto-apply-secret");
    if (secret !== process.env.AUTO_APPLY_WORKER_SECRET?.trim()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();

    if (!email) {
      return NextResponse.json({ error: "email query param required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ userId: user.id, email: user.email });
  } catch (error) {
    console.error("[resolve-user] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
