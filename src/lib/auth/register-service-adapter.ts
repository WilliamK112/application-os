import { prisma } from "@/lib/db/prisma";

export const registrationService = {
  createUser: async (input: { name: string; email: string; passwordHash: string }) => {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
      select: {
        id: true,
      },
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });
  },
};
