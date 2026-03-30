import { PrismaClient } from "@prisma/client";

declare global {
  var __applicationOsPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__applicationOsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__applicationOsPrisma = prisma;
}
