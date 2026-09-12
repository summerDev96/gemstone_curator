import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST as issueSession } from "../../sessions/route";
import { POST as createRecommendation } from "./route";

/**
 * E2E-03: LLM timeout/실패 상황에서도 fallback 결과로 결과 화면이 완성된다.
 * playwright.config.ts로 별도 서버를 띄우지 않고, getProvider.ts의
 * FORCE_LLM_FALLBACK_FOR_TESTS 스위치로 실제 fallback 경로를 결정론적으로 재현한다.
 * (@/lib/llm/getProvider를 모킹하지 않고 실제 로직을 그대로 사용한다.)
 */
describe("POST /api/v1/recommendations/basic (LLM 실패 시 fallback)", () => {
  beforeEach(() => {
    process.env.FORCE_LLM_FALLBACK_FOR_TESTS = "1";
  });
  afterEach(() => {
    delete process.env.FORCE_LLM_FALLBACK_FOR_TESTS;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("LLM 호출이 항상 실패해도 검수된 fallback 문장으로 201 결과가 완성된다", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken } = await sessionRes.json();

    const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
    const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });

    const res = await createRecommendation(
      new Request("http://localhost/api/v1/recommendations/basic", {
        method: "POST",
        headers: {
          authorization: `Bearer ${sessionToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ primaryWishTagId: primary.id, heartTagId: heart.id }),
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.usedFallback).toBe(true);
    expect(body.heartSummary).toBeTruthy();
    expect(body.rationale).toBeTruthy();
    expect(body.comfortLines.length).toBeGreaterThanOrEqual(2);
    expect(body.microAction).toBeTruthy();

    const stored = await prisma.recommendation.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(stored.usedFallback).toBe(true);
    expect(stored.modelName).toBe("fallback");
  });
});
