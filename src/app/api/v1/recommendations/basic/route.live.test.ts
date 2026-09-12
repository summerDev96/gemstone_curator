import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST as issueSession } from "../../sessions/route";
import { POST as createRecommendation } from "./route";

/**
 * 실제 OpenAI API를 호출하는 통합 테스트입니다.
 * 기본 `npm test`에서는 네트워크 비용/지연을 피하기 위해 건너뛰고,
 * `RUN_LIVE_LLM_TESTS=1 npm test`로 실행할 때만 동작합니다.
 */
const runLive = process.env.RUN_LIVE_LLM_TESTS === "1";

describe.skipIf(!runLive)("POST /api/v1/recommendations/basic (실제 OpenAI 연동)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("실제 LLM 호출이 성공하면 usedFallback=false로 카피를 생성한다", async () => {
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
        body: JSON.stringify({
          primaryWishTagId: primary.id,
          heartTagId: heart.id,
          freeText: "요즘 이직 준비 때문에 마음이 복잡해요.",
        }),
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.usedFallback).toBe(false);
    expect(body.heartSummary.length).toBeGreaterThan(0);
  }, 30000);
});
