import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: postDesire } = await import("./route");

async function getSessionToken(): Promise<string> {
  const res = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const body = await res.json();
  return body.sessionToken;
}

function callDesire(token: string, body: unknown) {
  return postDesire(
    new Request("http://localhost/api/v1/recommendations/desire", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/v1/recommendations/desire", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("사랑을 선택하면 매핑 표 순서상 1등 원석을 topStone으로, 나머지를 otherStones로 반환한다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "love" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.topStone.slug).toBe("turquoise");
    expect(body.otherStones.map((s: { slug: string }) => s.slug)).toEqual([
      "amazonite",
      "lapis-lazuli",
      "sapphire",
      "garnet",
      "jade",
    ]);
  });

  it("사랑과 연애는 동일한 결과를 반환한다(같은 목적 그룹)", async () => {
    const token = await getSessionToken();
    const loveRes = await callDesire(token, { desire: "love" });
    const romanceRes = await callDesire(token, { desire: "romance" });
    const love = await loveRes.json();
    const romance = await romanceRes.json();
    expect(romance.topStone.slug).toBe(love.topStone.slug);
    expect(romance.otherStones.map((s: { slug: string }) => s.slug)).toEqual(
      love.otherStones.map((s: { slug: string }) => s.slug),
    );
  });

  it("topStone에는 마음 요약/추천 이유/위로의 말/오늘의 작은 행동이 포함된다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "study" });
    const body = await res.json();
    expect(body.topStone.slug).toBe("lapis-lazuli");
    expect(body.topStone.heartSummary).toBeTruthy();
    expect(body.topStone.rationale).toBeTruthy();
    expect(body.topStone.comfortLines.length).toBeGreaterThan(0);
    expect(body.topStone.microAction).toBeTruthy();
    expect(body.otherStones).toEqual([]);
  });

  it("응답에는 개인정보가 없고 원석 상세 정보만 포함된다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "protection" });
    const body = await res.json();
    expect(body.topStone).toHaveProperty("nameKo");
    expect(body.topStone).toHaveProperty("colorHex");
    for (const stone of body.otherStones) {
      expect(stone).toHaveProperty("nameKo");
      expect(stone).toHaveProperty("colorHex");
    }
  });

  it("유효하지 않은 desire 값이면 400을 반환한다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "wealth" });
    expect(res.status).toBe(400);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    const res = await postDesire(
      new Request("http://localhost/api/v1/recommendations/desire", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ desire: "love" }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
