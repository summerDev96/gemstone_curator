import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, _resetRateLimitStoreForTests } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitStoreForTests();
  });

  it("한도 이내 요청은 허용한다", () => {
    const r1 = checkRateLimit("ip:1.2.3.4", 3, 1000, 0);
    const r2 = checkRateLimit("ip:1.2.3.4", 3, 1000, 10);
    const r3 = checkRateLimit("ip:1.2.3.4", 3, 1000, 20);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("한도를 초과하면 차단한다", () => {
    checkRateLimit("ip:1.2.3.4", 2, 1000, 0);
    checkRateLimit("ip:1.2.3.4", 2, 1000, 10);
    const blocked = checkRateLimit("ip:1.2.3.4", 2, 1000, 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("윈도우가 지나면 다시 허용한다", () => {
    checkRateLimit("ip:1.2.3.4", 1, 1000, 0);
    const stillBlocked = checkRateLimit("ip:1.2.3.4", 1, 1000, 500);
    const allowedAgain = checkRateLimit("ip:1.2.3.4", 1, 1000, 1500);
    expect(stillBlocked.allowed).toBe(false);
    expect(allowedAgain.allowed).toBe(true);
  });

  it("키가 다르면 독립적으로 집계한다", () => {
    checkRateLimit("ip:1.1.1.1", 1, 1000, 0);
    const other = checkRateLimit("ip:2.2.2.2", 1, 1000, 0);
    expect(other.allowed).toBe(true);
  });
});
