"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";
import { prisma } from "@/lib/db/prisma";
import { authAuditLogService } from "@/lib/security/audit-log";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormState = {
  error: string;
  success: string;
};

const DEFAULT_STATE: ResetPasswordFormState = {
  error: "",
  success: "",
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 3;
const RATE_LIMIT_ERROR_MESSAGE =
  "Too many password reset attempts. Please wait a few minutes and try again.";

export const resetPasswordAudit = {
  record: authAuditLogService.record.bind(authAuditLogService),
};

export const resetPasswordService = {
  checkRateLimit: async (input: { tokenHash: string; ip: string }) => {
    const tokenAllowed = consumeRateLimit({
      key: `reset-password:token:${input.tokenHash}`,
      maxAttempts: MAX_ATTEMPTS_PER_WINDOW,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    if (!tokenAllowed.allowed) {
      return false;
    }

    const ipAllowed = consumeRateLimit({
      key: `reset-password:ip:${input.ip}`,
      maxAttempts: MAX_ATTEMPTS_PER_WINDOW,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });

    return ipAllowed.allowed;
  },
  findTokenByHash: async (tokenHash: string) =>
    prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    }),
  consumeTokenAndUpdatePassword: async (input: {
    tokenId: string;
    userId: string;
    passwordHash: string;
  }) => {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: input.userId },
        data: {
          passwordHash: input.passwordHash,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: input.tokenId },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);
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

export async function resetPasswordAction(
  previousState: ResetPasswordFormState = DEFAULT_STATE,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  void previousState;

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to reset password right now.",
      success: "",
    };
  }

  try {
    const tokenHash = hashPasswordResetToken(parsed.data.token);
    const ip = await getRequestIp();
    const isAllowed = await resetPasswordService.checkRateLimit({ tokenHash, ip });

    if (!isAllowed) {
      await resetPasswordAudit.record({
        event: "auth.password-reset.completed",
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

    const token = await resetPasswordService.findTokenByHash(tokenHash);

    if (!token) {
      await resetPasswordAudit.record({
        event: "auth.password-reset.completed",
        ip,
        metadata: {
          outcome: "invalid_token",
        },
      });

      return {
        error: "This password reset link is invalid.",
        success: "",
      };
    }

    if (token.usedAt) {
      await resetPasswordAudit.record({
        event: "auth.password-reset.completed",
        actorUserId: token.userId,
        ip,
        metadata: {
          outcome: "already_used",
        },
      });

      return {
        error: "This password reset link has already been used.",
        success: "",
      };
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      await resetPasswordAudit.record({
        event: "auth.password-reset.completed",
        actorUserId: token.userId,
        ip,
        metadata: {
          outcome: "expired",
        },
      });

      return {
        error: "This password reset link has expired.",
        success: "",
      };
    }

    await resetPasswordService.consumeTokenAndUpdatePassword({
      tokenId: token.id,
      userId: token.userId,
      passwordHash: hashPassword(parsed.data.password),
    });

    await resetPasswordAudit.record({
      event: "auth.password-reset.completed",
      actorUserId: token.userId,
      ip,
      metadata: {
        outcome: "success",
      },
    });
  } catch {
    await resetPasswordAudit.record({
      event: "auth.password-reset.completed",
      metadata: {
        outcome: "error",
      },
    });

    return {
      error: "Unable to reset password right now. Please try again.",
      success: "",
    };
  }

  return {
    error: "",
    success: "Password updated successfully. Please sign in with your new password.",
  };
}
