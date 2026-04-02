"use server";

/**
 * Session adapter for Next.js route handlers.
 *
 * Routes use:
 *   import { authSession } from "@/lib/auth/session-adapter";
 *   const session = await authSession(); // returns { user: { id } }
 *
 * Server Components use:
 *   import { getCurrentUserOrThrow } from "@/lib/auth/session-adapter";
 *   const user = await getCurrentUserOrThrow(); // returns User
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { User } from "@/types/domain";

/** Returns the full User record from the DB. Use in Server Components. */
export async function getCurrentUserOrThrow(): Promise<User> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

/**
 * Lightweight session for route handlers.
 * Returns { user: { id } } so routes can do: if (!session?.user?.id)
 */
export async function authSession(): Promise<{ user: { id: string } }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { user: { id: session.user.id } };
}
