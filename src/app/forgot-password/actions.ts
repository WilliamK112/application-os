"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createPasswordResetToken, hashPasswordResetToken } from "@/lib/auth/password-reset";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/lib/email/password-reset-email";
import { authAuditLogService } from "@/lib/security/audit-log";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
});

export type ForgotPasswordFormState = {
  error: string;
  success: string;
};

const DEFAULT_STATE: ForgotPasswordFormState = {
  error: "",
  success: "",
};

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for this email, we've sent password reset instructions.";
const RATE_LIMIT_ERROR_MESSAGE =
  "Too many password reset attempts. Please wait a few minutes and try again.";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 3;

export const forgotPasswordAudit = {
  record: authAuditLogService.record.bind(authAuditLogService),
};

export const forgotPasswordService = {
  checkRateLimit: async (input: { email: string; ip: string }) => {
    const emailAllowed = consumeRateLimit({
      key: `forgot-password:email:${input.email}`,
      maxAttempts: MAX_ATTEMPTS_PER_WINDOW,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!emailAllowed.allowed) {
      return false;
    }

    const ipAllowed = consumeRateLimit({
      key: `forgot-password:ip:${input.ip}`,
      maxAttempts: MAX_ATTEMPTS_PER_WINDOW,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    return ipAllowed.allowed;
  },
  findUserByEmail: async (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    }),
  createPasswordResetToken: async (input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) =>
    prisma.passwordResetToken.create({
      data: input,
      select: { id: true },
    }),
  sendResetInstructions: async (input: { email: string; token: string }) => {
    await sendPasswordResetEmail(input);
  },
};

async function getRequestIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const realIp = requestHeaders.get("x-real-ip");

    const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

    return firstForwardedIp || realIp || "unknown";
  } catch {
    return "unknown";
  }
}

export async function requestPasswordResetAction(
  previousState: ForgotPasswordFormState = DEFAULT_STATE,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  void previousState;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to continue.",
      success: "",
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const ip = await getRequestIp();
    const isAllowed = await forgotPasswordService.checkRateLimit({ email, ip });

    if (!isAllowed) {
      await forgotPasswordAudit.record({
        event: "auth.password-reset.requested",
        email,
        ip,
        metadata: {
          outcome: "rate_limited",
        },
      });

      return {
        error: RATE_LIMIT_ERROR_MESSAGE,
        success: "",
      };
    }

    const user = await forgotPasswordService.findUserByEmail(email);

    if (user) {
      const rawToken = createPasswordResetToken();
      const tokenHash = hashPasswordResetToken(rawToken);

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await forgotPasswordService.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await forgotPasswordService.sendResetInstructions({
        email: user.email,
        token: rawToken,
      });

      await forgotPasswordAudit.record({
        event: "auth.password-reset.requested",
        actorUserId: user.id,
        email: user.email,
        ip,
        metadata: {
          outcome: "token_sent",
        },
      });
    } else {
      await forgotPasswordAudit.record({
        event: "auth.password-reset.requested",
        email,
        ip,
        metadata: {
          outcome: "user_not_found",
        },
      });
    }
  } catch {
    await forgotPasswordAudit.record({
      event: "auth.password-reset.requested",
      email,
      metadata: {
        outcome: "error",
      },
    });

    return {
      error: "Unable to create password reset request right now. Please try again.",
      success: "",
    };
  }

  return {
    error: "",
    success: GENERIC_SUCCESS_MESSAGE,
  };
}
