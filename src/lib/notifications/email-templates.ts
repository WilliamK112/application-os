export enum NotificationType {
  FOLLOW_UP = "follow_up",
  INTERVIEW = "interview",
}

interface NotificationInput {
  type: NotificationType;
  userName: string;
  dueAt: string;
  content?: string;
  applicationLabel?: string;
  interviewType?: string;
  interviewerName?: string;
  location?: string;
  notes?: string;
  link: string;
}

export function sendNotificationEmail(input: NotificationInput): { html: string; text: string } {
  const dateStr = new Date(input.dueAt).toLocaleString();

  if (input.type === NotificationType.FOLLOW_UP) {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e293b;">⏰ Follow-up Reminder</h2>
  <p>Hi ${input.userName},</p>
  <p>You have a follow-up <strong>due soon</strong>:</p>
  <blockquote style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
    ${input.content ? `<p style="margin: 0 0 8px;">${input.content}</p>` : ""}
    <p style="margin: 0; color: #64748b; font-size: 14px;">Due: ${dateStr}</p>
    ${input.applicationLabel ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">📋 ${input.applicationLabel}</p>` : ""}
  </blockquote>
  <a href="${input.link}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">View in Application OS</a>
  <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">You\'re receiving this because you have follow-ups in Application OS.</p>
</body>
</html>`;
    const text = `Follow-up Reminder

Hi ${input.userName},

You have a follow-up due: ${input.content ?? "Action needed"}
Due: ${dateStr}
${input.applicationLabel ? `Application: ${input.applicationLabel}` : ""}

View in Application OS: ${input.link}`;
    return { html, text };
  }

  // Interview type
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1e293b;">📅 Interview Reminder</h2>
  <p>Hi ${input.userName},</p>
  <p>You have an interview <strong>coming up</strong>:</p>
  <blockquote style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 12px 16px; margin: 16px 0;">
    <p style="margin: 0 0 8px; font-weight: 600;">${input.interviewType?.replace(/_/g, " ") ?? "Interview"}</p>
    <p style="margin: 0; color: #64748b; font-size: 14px;">🗓 ${dateStr}</p>
    ${input.interviewerName ? `<p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">👤 ${input.interviewerName}</p>` : ""}
    ${input.location ? `<p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">📍 ${input.location}</p>` : ""}
    ${input.notes ? `<p style="margin: 8px 0 0; color: #475569; font-size: 14px;">${input.notes.slice(0, 200)}</p>` : ""}
  </blockquote>
  <a href="${input.link}" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px;">View in Application OS</a>
  <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">You\'re receiving this because you have interviews in Application OS.</p>
</body>
</html>`;
  const text = `Interview Reminder

Hi ${input.userName},

You have an interview coming up:
- Type: ${input.interviewType?.replace(/_/g, " ") ?? "Interview"}
- When: ${dateStr}
${input.interviewerName ? `- Interviewer: ${input.interviewerName}` : ""}
${input.location ? `- Location: ${input.location}` : ""}
${input.notes ? `- Notes: ${input.notes.slice(0, 200)}` : ""}

View in Application OS: ${input.link}`;
  return { html, text };
}
