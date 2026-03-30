import { NextResponse } from "next/server";
import { sendFollowUpReminders, sendInterviewReminders } from "@/lib/notifications/notification-service";

/**
 * GET /api/reminders
 * Sends reminders for upcoming follow-ups and interviews.
 * Called by a cron job (e.g., GitHub Actions scheduled workflow, Vercel Cron).
 * Protected by a secret token to prevent unauthorized calls.
 *
 * Env vars:
 *   REMINDERS_SECRET — secret token required in Authorization header
 *   APP_OS_NOTIFY_EMAIL — email address to send reminders to
 *   APP_OS_EMAIL_PROVIDER — "resend" | "console" (default: console)
 */
export async function GET(request: Request) {
  // Verify secret token
  const secret = process.env.REMINDERS_SECRET;
  if (secret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const hoursAhead = parseInt(new URL(request.url).searchParams.get("hours") ?? "24", 10);

  const [followUpResult, interviewResult] = await Promise.allSettled([
    sendFollowUpReminders(hoursAhead),
    sendInterviewReminders(hoursAhead),
  ]);

  const followUpReport =
    followUpResult.status === "fulfilled"
      ? followUpResult.value
      : { sent: 0, errors: 1, details: [String(followUpResult.reason)] };
  const interviewReport =
    interviewResult.status === "fulfilled"
      ? interviewResult.value
      : { sent: 0, errors: 1, details: [String(interviewResult.reason)] };

  const totalSent = followUpReport.sent + interviewReport.sent;
  const totalErrors = followUpReport.errors + interviewReport.errors;

  return NextResponse.json(
    {
      ok: totalErrors === 0,
      totalSent,
      totalErrors,
      followUps: followUpReport,
      interviews: interviewReport,
      at: new Date().toISOString(),
    },
    { status: totalErrors === 0 ? 200 : 207 },
  );
}
