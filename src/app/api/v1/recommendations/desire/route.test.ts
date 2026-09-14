import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST as issueSession } from "../../sessions/route";

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

  it("사랑을 선택하면 매핑 표에 등록된 원석들을 순서대로 반환한다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "love" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stones.map((s: { slug: string }) => s.slug)).toEqual([
      "turquoise",
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
    expect(romance.stones.map((s: { slug: string }) => s.slug)).toEqual(
      love.stones.map((s: { slug: string }) => s.slug),
    );
  });

  it("응답에는 개인정보가 없고 원석 상세 정보만 포함된다", async () => {
    const token = await getSessionToken();
    const res = await callDesire(token, { desire: "protection" });
    const body = await res.json();
    expect(body.stones.length).toBeGreaterThan(0);
    for (const stone of body.stones) {
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
