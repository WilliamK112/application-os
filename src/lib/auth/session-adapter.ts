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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
const _authSessionBase = async () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return _authSession.getCurrentUserOrThrow().then((user) => ({ user: { id: user.id } }));
};

const _authSession: typeof _authSessionBase & { getCurrentUserOrThrow: () => Promise<User> } =
  _authSessionBase as typeof _authSessionBase & { getCurrentUserOrThrow: () => Promise<User> };

Object.defineProperty(_authSession, 'getCurrentUserOrThrow', {
  value: getCurrentUserOrThrow,
  writable: true,
  configurable: true,
});

export const authSession: typeof _authSessionBase & { getCurrentUserOrThrow: () => Promise<User> } = _authSession;
export { _authSession as authSessionGetter };
