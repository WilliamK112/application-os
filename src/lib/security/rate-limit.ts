type RateLimitBucket = {
  attempts: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function consumeRateLimit(input: {
  key: string;
  maxAttempts: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, {
      attempts: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: Math.max(0, input.maxAttempts - 1),
      resetAt,
    };
  }

  if (existing.attempts >= input.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.attempts += 1;
  buckets.set(input.key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, input.maxAttempts - existing.attempts),
    resetAt: existing.resetAt,
  };
}

export function resetRateLimitStore(): void {
  buckets.clear();
}
