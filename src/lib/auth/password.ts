import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedKey] = passwordHash.split(":");
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedBuffer = Buffer.from(derivedKey, "hex");

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedBuffer);
}
