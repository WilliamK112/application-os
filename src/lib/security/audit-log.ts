export type AuthAuditEventName =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.password-reset.requested"
  | "auth.password-reset.completed";

export type AuthAuditEvent = {
  event: AuthAuditEventName;
  occurredAt: string;
  actorUserId?: string;
  email?: string;
  ip?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type AuditLogSink = {
  write: (event: AuthAuditEvent) => Promise<void>;
};

const consoleSink: AuditLogSink = {
  async write(event) {
    console.info("[audit]", JSON.stringify(event));
  },
};

export const authAuditLogService = {
  sink: consoleSink as AuditLogSink,
  setSink(nextSink: AuditLogSink) {
    this.sink = nextSink;
  },
  resetSink() {
    this.sink = consoleSink;
  },
  async record(input: {
    event: AuthAuditEventName;
    actorUserId?: string;
    email?: string;
    ip?: string;
    metadata?: Record<string, string | number | boolean | null | undefined>;
  }): Promise<void> {
    const payload: AuthAuditEvent = {
      event: input.event,
      occurredAt: new Date().toISOString(),
      actorUserId: input.actorUserId,
      email: input.email,
      ip: input.ip,
      metadata: input.metadata,
    };

    try {
      await this.sink.write(payload);
    } catch {
      // Non-blocking by design; auth flow should not fail because audit sink failed.
    }
  },
};
