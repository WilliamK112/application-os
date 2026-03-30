"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { registrationService } from "@/lib/auth/register-service-adapter";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
    email: z.string().trim().email("Please enter a valid email."),
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

export type RegisterFormState = {
  error: string;
};

const DEFAULT_STATE: RegisterFormState = {
  error: "",
};

export async function registerAction(
  previousState: RegisterFormState = DEFAULT_STATE,
  formData: FormData,
): Promise<RegisterFormState> {
  void previousState;
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to register right now.",
    };
  }

  const input = parsed.data;

  try {
    await registrationService.createUser({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: hashPassword(input.password),
    });
  } catch (error) {
    const errorCode =
      error instanceof Prisma.PrismaClientKnownRequestError
        ? error.code
        : typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : undefined;

    if (errorCode === "P2002") {
      return {
        error: "An account with this email already exists.",
      };
    }

    return {
      error: "Unable to register right now. Please try again.",
    };
  }

  redirect("/login?registered=1");
}
