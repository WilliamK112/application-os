import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { authAuditLogService } from "@/lib/security/audit-log";

type FailedLoginBucket = {
  attempts: number;
  resetAt: number;
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
const failedLoginBuckets = new Map<string, FailedLoginBucket>();

function getEmailRateLimitKey(email: string): string {
  return `login:email:${email}`;
}

function getIpRateLimitKey(ip: string): string {
  return `login:ip:${ip}`;
}

function getClientIp(input: unknown): string {
  if (!input || typeof input !== "object") {
    return "unknown";
  }

  const candidate = input as {
    headers?: Headers | Record<string, string | string[] | undefined>;
  };

  const headers = candidate.headers;
  if (!headers) {
    return "unknown";
  }

  let rawForwardedFor: string | null = null;

  if (headers instanceof Headers) {
    rawForwardedFor = headers.get("x-forwarded-for");
  } else {
    const value = headers["x-forwarded-for"];
    if (typeof value === "string") {
      rawForwardedFor = value;
    } else if (Array.isArray(value) && value.length > 0) {
      rawForwardedFor = value[0] ?? null;
    }
  }

  if (!rawForwardedFor) {
    return "unknown";
  }

  const firstIp = rawForwardedFor
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);

  return firstIp || "unknown";
}

function isRateLimitAllowed(key: string): boolean {
  const existing = failedLoginBuckets.get(key);
  const now = Date.now();

  if (!existing || existing.resetAt <= now) {
    return true;
  }

  return existing.attempts < LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const existing = failedLoginBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    failedLoginBuckets.set(key, {
      attempts: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  existing.attempts += 1;
  failedLoginBuckets.set(key, existing);
}

function clearFailedAttempts(key: string): void {
  failedLoginBuckets.delete(key);
}

export const loginRateLimitService = {
  getEmailRateLimitKey,
  getIpRateLimitKey,
  getClientIp,
  isRateLimitAllowed,
  recordFailedAttempt,
  clearFailedAttempts,
  resetStore(): void {
    failedLoginBuckets.clear();
  },
};

export const loginAudit = {
  record: authAuditLogService.record.bind(authAuditLogService),
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const ip = loginRateLimitService.getClientIp(request);
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          await loginAudit.record({
            event: "auth.login.failed",
            ip,
            metadata: {
              outcome: "invalid_payload",
            },
          });
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const password = parsed.data.password;
        const emailKey = loginRateLimitService.getEmailRateLimitKey(email);
        const ipKey = loginRateLimitService.getIpRateLimitKey(ip);

        if (!loginRateLimitService.isRateLimitAllowed(emailKey) || !loginRateLimitService.isRateLimitAllowed(ipKey)) {
          await loginAudit.record({
            event: "auth.login.failed",
            email,
            ip,
            metadata: {
              outcome: "rate_limited",
            },
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            timezone: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash) {
          loginRateLimitService.recordFailedAttempt(emailKey);
          loginRateLimitService.recordFailedAttempt(ipKey);
          await loginAudit.record({
            event: "auth.login.failed",
            email,
            ip,
            metadata: {
              outcome: "invalid_credentials",
            },
          });
          return null;
        }

        const isValidPassword = verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          loginRateLimitService.recordFailedAttempt(emailKey);
          loginRateLimitService.recordFailedAttempt(ipKey);
          await loginAudit.record({
            event: "auth.login.failed",
            actorUserId: user.id,
            email,
            ip,
            metadata: {
              outcome: "invalid_credentials",
            },
          });
          return null;
        }

        loginRateLimitService.clearFailedAttempts(emailKey);
        loginRateLimitService.clearFailedAttempts(ipKey);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });

        await loginAudit.record({
          event: "auth.login.success",
          actorUserId: user.id,
          email: user.email,
          ip,
          metadata: {
            outcome: "success",
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.timezone = (user as { timezone?: string }).timezone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.name = token.name ?? session.user.name ?? "";
        session.user.timezone = typeof token.timezone === "string" ? token.timezone : undefined;
      }
      return session;
    },
  },
};
