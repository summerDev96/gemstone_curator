import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("./route");

async function getSessionToken(): Promise<string> {
  const res = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const body = await res.json();
  return body.sessionToken;
}

async function getTags() {
  const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
  const secondary = await prisma.tag.findFirstOrThrow({
    where: { category: "WISH", id: { not: primary.id } },
  });
  const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });
  return { primary, secondary, heart };
}

function postBasic(token: string, body: unknown) {
  return createRecommendation(
    new Request("http://localhost/api/v1/recommendations/basic", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/v1/recommendations/basic", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("세션 없이 호출하면 401을 반환한다", async () => {
    const res = await createRecommendation(
      new Request("http://localhost/api/v1/recommendations/basic", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("유효하지 않은 입력이면 400과 fieldErrors를 반환한다", async () => {
    const token = await getSessionToken();
    const res = await postBasic(token, { primaryWishTagId: "not-a-uuid", heartTagId: "also-not" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fieldErrors).toBeTruthy();
  });

  it("존재하지 않는 태그 ID면 404를 반환한다", async () => {
    const token = await getSessionToken();
    const res = await postBasic(token, {
      primaryWishTagId: "11111111-1111-4111-8111-111111111111",
      heartTagId: "22222222-2222-4222-8222-222222222222",
    });
    expect(res.status).toBe(404);
  });

  it("정상 입력이면 원석과 카피를 포함한 추천 결과를 생성하고 freeText는 저장하지 않는다", async () => {
    const token = await getSessionToken();
    const { primary, heart } = await getTags();
    const res = await postBasic(token, {
      primaryWishTagId: primary.id,
      heartTagId: heart.id,
      freeText: "테스트용 자유 입력입니다.",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    expect(body.stone.nameKo).toBeTruthy();
    expect(body.heartSummary).toBeTruthy();
    expect(body.rationale).toBeTruthy();
    expect(Array.isArray(body.comfortLines)).toBe(true);
    expect(body.comfortLines.length).toBeGreaterThanOrEqual(2);
    expect(body.microAction).toBeTruthy();
    expect(typeof body.usedFallback).toBe("boolean");

    const wishSession = await prisma.wishSession.findUnique({
      where: { id: (await prisma.recommendation.findUniqueOrThrow({ where: { id: body.id } })).wishSessionId },
    });
    expect(wishSession?.freeTextProvided).toBe(true);
    expect(JSON.stringify(wishSession)).not.toContain("테스트용 자유 입력입니다");
  });

  it("위기 표현이 포함되면 422 SAFETY_BLOCKED를 반환하고 이 세션에는 결과를 생성하지 않는다", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionId, sessionToken } = await sessionRes.json();
    const { primary, heart } = await getTags();

    const res = await postBasic(sessionToken, {
      primaryWishTagId: primary.id,
      heartTagId: heart.id,
      freeText: "요즘 너무 힘들어서 그냥 죽고 싶다는 생각이 들어요",
    });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("SAFETY_BLOCKED");

    const recommendationsForThisSession = await prisma.recommendation.findMany({
      where: { wishSession: { anonymousSessionId: sessionId } },
    });
    expect(recommendationsForThisSession).toHaveLength(0);
  });
});
