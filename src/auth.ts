import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            updatedAt: new Date(),
          },
          create: {
            email,
            name: email.split("@")[0] ?? "User",
            timezone: "America/Chicago",
          },
          select: {
            id: true,
            email: true,
            name: true,
            timezone: true,
          },
        });

        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
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
});
