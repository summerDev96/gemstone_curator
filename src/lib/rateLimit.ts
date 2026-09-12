interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * In-memory sliding-window rate limiter. Single-instance only —
 * docs/12-privacy-security-compliance.md#rate-limiting 참조 (다중 인스턴스 배포 시 공유 저장소로 교체 필요).
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldest + windowMs - now,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterMs: 0,
  };
}

export function _resetRateLimitStoreForTests(): void {
  buckets.clear();
}
