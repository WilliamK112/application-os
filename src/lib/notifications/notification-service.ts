/**
 * Notification service for follow-up and interview reminders.
 * Can be called by a cron job or manually.
 * Uses Resend API when configured, falls back to console logging.
 */

import { applicationOsRepository } from "@/lib/repositories/application-os-repository";
import { sendNotificationEmail, NotificationType } from "./email-templates";

export interface ReminderResult {
  sent: number;
  skipped: number;
  errors: number;
  details: string[];
}

const RESEND_API_URL = "https://api.resend.com/emails";

function getBaseUrl(): string {
  return process.env.APP_OS_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function sendEmailViaResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.APP_OS_RESEND_API_KEY;
  const fromEmail = process.env.APP_OS_EMAIL_FROM;

  if (!apiKey || !fromEmail) {
    throw new Error("Missing APP_OS_RESEND_API_KEY or APP_OS_EMAIL_FROM");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend delivery failed: ${response.status}`);
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const provider = process.env.APP_OS_EMAIL_PROVIDER ?? "console";
  if (provider === "resend") {
    await sendEmailViaResend({ to, subject, html, text });
    return;
  }
  process.stdout.write(`[notification] to=${to} subject="${subject}"\n`);
  void html;
}

/**
 * Send reminders for follow-ups due within the next `hoursAhead` window.
 */
export async function sendFollowUpReminders(hoursAhead = 24): Promise<ReminderResult> {
  const repository = applicationOsRepository;
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const result: ReminderResult = { sent: 0, skipped: 0, errors: 0, details: [] };

  try {
    const allFollowUps = await repository.listFollowUps("__all__");
    // Filter to pending follow-ups due within window
    const pendingDueSoon = allFollowUps.filter(
      (f) =>
        f.status === "PENDING" &&
        new Date(f.dueAt) <= cutoff &&
        new Date(f.dueAt) >= now,
    );

    // Get user emails (we need user data)
    // For the mock, we send to the current mock user
    // In production, we'd look up user email from userId
    for (const followUp of pendingDueSoon) {
      const email = process.env.APP_OS_NOTIFY_EMAIL ?? "user@example.com";
      const subject = `⏰ Follow-up reminder: ${followUp.content ?? "Action needed"}`;
      const { html, text } = sendNotificationEmail({
        type: NotificationType.FOLLOW_UP,
        userName: "there",
        dueAt: followUp.dueAt,
        content: followUp.content ?? undefined,
        applicationLabel: `Application ${followUp.applicationId}`,
        link: `${getBaseUrl()}/followups`,
      });

      try {
        await sendEmail(email, subject, html, text);
        result.sent++;
        result.details.push(`sent follow-up reminder to ${email}`);
      } catch (err) {
        result.errors++;
        result.details.push(`error sending to ${email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    result.skipped = pendingDueSoon.length === 0 ? 0 : 0;
    if (pendingDueSoon.length === 0) {
      result.details.push("no follow-ups due in the next window");
    }
  } catch (err) {
    result.errors++;
    result.details.push(`critical error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}

/**
 * Send reminders for interviews scheduled within the next `hoursAhead` window.
 */
export async function sendInterviewReminders(hoursAhead = 24): Promise<ReminderResult> {
  const repository = applicationOsRepository;
  const now = new Date();
  const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const result: ReminderResult = { sent: 0, skipped: 0, errors: 0, details: [] };

  try {
    const allInterviews = await repository.listInterviews("__all__");
    const upcomingSoon = allInterviews.filter(
      (i) =>
        i.scheduledAt &&
        new Date(i.scheduledAt) <= cutoff &&
        new Date(i.scheduledAt) >= now,
    );

    for (const interview of upcomingSoon) {
      const email = process.env.APP_OS_NOTIFY_EMAIL ?? "user@example.com";
      const subject = `📅 Interview reminder: ${interview.interviewType.replace(/_/g, " ")}`;
      const { html, text } = sendNotificationEmail({
        type: NotificationType.INTERVIEW,
        userName: "there",
        dueAt: interview.scheduledAt!,
        interviewType: interview.interviewType,
        interviewerName: interview.interviewerName,
        location: interview.location,
        notes: interview.notes,
        link: `${getBaseUrl()}/interviews`,
      });

      try {
        await sendEmail(email, subject, html, text);
        result.sent++;
        result.details.push(`sent interview reminder to ${email}`);
      } catch (err) {
        result.errors++;
        result.details.push(`error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (upcomingSoon.length === 0) {
      result.details.push("no interviews in the next window");
    }
  } catch (err) {
    result.errors++;
    result.details.push(`critical error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
}
