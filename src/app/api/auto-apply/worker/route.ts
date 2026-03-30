import { NextRequest, NextResponse } from "next/server";
import { applicationOsService } from "@/lib/services/application-os-service";

// Internal endpoint for the auto-apply worker — NOT exposed to the public internet.
// In production, protect this with a static worker secret or IP allowlist.
// Railway worker calls this every N seconds via its own internal network.

export const maxDuration = 60; // soft limit for long-running requests

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-auto-apply-secret");

  // Validate internal secret (set AUTO_APPLY_WORKER_SECRET env var on both sides)
  if (process.env.AUTO_APPLY_WORKER_SECRET) {
    if (secret !== process.env.AUTO_APPLY_WORKER_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const queue = await applicationOsService.getAutoApplyQueue(userId);
    const pending = queue.filter((item) => item.status === "PENDING");

    return NextResponse.json({
      pending,
      queueStats: {
        total: queue.length,
        pending: pending.length,
        inProgress: queue.filter((i) => i.status === "IN_PROGRESS").length,
        needsVerification: queue.filter((i) => i.status === "NEEDS_VERIFICATION").length,
        completed: queue.filter((i) => i.status === "COMPLETED").length,
        failed: queue.filter((i) => i.status === "FAILED").length,
      },
    });
  } catch (err) {
    console.error("[auto-apply-worker] GET /queue error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-auto-apply-secret");

  if (process.env.AUTO_APPLY_WORKER_SECRET) {
    if (secret !== process.env.AUTO_APPLY_WORKER_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { queueItemId, userId, status, verificationToken, errorMessage, applicationId } = body;

    if (!queueItemId || !userId) {
      return NextResponse.json(
        { error: "queueItemId and userId are required" },
        { status: 400 },
      );
    }

    const validStatuses = ["PENDING", "IN_PROGRESS", "NEEDS_VERIFICATION", "COMPLETED", "FAILED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const updated = await applicationOsService.updateQueueItemStatus(
      userId,
      queueItemId,
      {
        status: status as "PENDING" | "IN_PROGRESS" | "NEEDS_VERIFICATION" | "COMPLETED" | "FAILED",
        verificationToken,
        errorMessage,
        applicationId,
      },
    );

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    console.error("[auto-apply-worker] POST update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
