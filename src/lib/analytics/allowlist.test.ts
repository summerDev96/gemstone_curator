import { describe, expect, it } from "vitest";
import { assertSafeAnalyticsProps, isAllowedAnalyticsEvent } from "./allowlist";

describe("analytics allowlist", () => {
  it("허용된 이벤트명만 통과시킨다", () => {
    expect(isAllowedAnalyticsEvent("landing_view")).toBe(true);
    expect(isAllowedAnalyticsEvent("some_random_event")).toBe(false);
  });

  it("금지된 필드가 포함되면 예외를 던진다", () => {
    expect(() => assertSafeAnalyticsProps({ freeText: "민감정보" })).toThrow();
    expect(() => assertSafeAnalyticsProps({ birthDate: "1990-01-01" })).toThrow();
  });

  it("허용된 필드만 있으면 통과한다", () => {
    expect(() =>
      assertSafeAnalyticsProps({ screenId: "S02", selected: true, count: 2 }),
    ).not.toThrow();
  });
});
