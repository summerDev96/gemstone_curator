import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("./basic/route");
const { GET: listRecommendations } = await import("./route");

async function createSessionWithRecommendations(count: number) {
  const sessionRes = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const { sessionId, sessionToken } = await sessionRes.json();
  const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
  const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });

  for (let i = 0; i < count; i++) {
    await createRecommendation(
      new Request("http://localhost/api/v1/recommendations/basic", {
        method: "POST",
        headers: { authorization: `Bearer ${sessionToken}`, "content-type": "application/json" },
        body: JSON.stringify({ primaryWishTagId: primary.id, heartTagId: heart.id }),
      }),
    );
  }

  return { sessionId, sessionToken };
}

describe("GET /api/v1/recommendations (보관함, 로그인 불필요)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("세션 없이 호출하면 401을 반환한다", async () => {
    const res = await listRecommendations(
      new Request("http://localhost/api/v1/recommendations"),
    );
    expect(res.status).toBe(401);
  });

  it("빈 세션은 빈 목록을 반환한다", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken } = await sessionRes.json();

    const res = await listRecommendations(
      new Request("http://localhost/api/v1/recommendations", {
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it("최신순으로 자신의 세션 결과만 반환하고 다른 세션 결과는 섞이지 않는다", async () => {
    const { sessionToken } = await createSessionWithRecommendations(2);
    const other = await createSessionWithRecommendations(1);

    const res = await listRecommendations(
      new Request("http://localhost/api/v1/recommendations", {
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );
    const body = await res.json();
    expect(body.items).toHaveLength(2);

    const otherRes = await listRecommendations(
      new Request("http://localhost/api/v1/recommendations", {
        headers: { authorization: `Bearer ${other.sessionToken}` },
      }),
    );
    const otherBody = await otherRes.json();
    expect(otherBody.items).toHaveLength(1);
  });

  it("limit과 cursor로 페이지네이션한다", async () => {
    const { sessionToken } = await createSessionWithRecommendations(3);

    const firstPage = await listRecommendations(
      new Request("http://localhost/api/v1/recommendations?limit=2", {
        headers: { authorization: `Bearer ${sessionToken}` },
      }),
    );
    const firstBody = await firstPage.json();
    expect(firstBody.items).toHaveLength(2);
    expect(firstBody.nextCursor).toBeTruthy();

    const secondPage = await listRecommendations(
      new Request(
        `http://localhost/api/v1/recommendations?limit=2&cursor=${firstBody.nextCursor}`,
        { headers: { authorization: `Bearer ${sessionToken}` } },
      ),
    );
    const secondBody = await secondPage.json();
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.nextCursor).toBeNull();
  });
});
