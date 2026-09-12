import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("../../basic/route");
const { POST: createShareLink } = await import("./route");
const { GET: getShare } = await import("../../../shares/[token]/route");
const { DELETE: deleteShareLink } = await import(
  "../../../share-links/[token]/route"
);

async function setup(): Promise<{ token: string; id: string }> {
  const sessionRes = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const { sessionToken } = await sessionRes.json();
  const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
  const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });
  const res = await createRecommendation(
    new Request("http://localhost/api/v1/recommendations/basic", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({ primaryWishTagId: primary.id, heartTagId: heart.id }),
    }),
  );
  const { id } = await res.json();
  return { token: sessionToken, id };
}

describe("공유 링크 발급/조회/철회", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("발급된 토큰으로 공개 조회하면 개인정보 없는 요약 카드가 반환된다", async () => {
    const { token, id } = await setup();
    const createRes = await createShareLink(
      new Request(`http://localhost/api/v1/recommendations/${id}/share-links`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ scope: "basic" }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(createRes.status).toBe(201);
    const { token: shareToken } = await createRes.json();

    const publicRes = await getShare(
      new Request(`http://localhost/api/v1/shares/${shareToken}`),
      { params: Promise.resolve({ token: shareToken }) },
    );
    expect(publicRes.status).toBe(200);
    const body = await publicRes.json();
    expect(body.stone.nameKo).toBeTruthy();
    expect(body.summary).toBeTruthy();

    const forbiddenKeys = ["sessionId", "userId", "email", "birthDate", "birthTime"];
    for (const key of forbiddenKeys) {
      expect(JSON.stringify(body)).not.toContain(key);
    }
  });

  it("존재하지 않는 토큰은 404를 반환한다", async () => {
    const res = await getShare(
      new Request("http://localhost/api/v1/shares/shr_doesnotexist"),
      { params: Promise.resolve({ token: "shr_doesnotexist" }) },
    );
    expect(res.status).toBe(404);
  });

  it("소유자가 철회하면 이후 공개 조회는 410을 반환한다", async () => {
    const { token, id } = await setup();
    const createRes = await createShareLink(
      new Request(`http://localhost/api/v1/recommendations/${id}/share-links`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ scope: "basic" }),
      }),
      { params: Promise.resolve({ id }) },
    );
    const { token: shareToken } = await createRes.json();

    const revokeRes = await deleteShareLink(
      new Request(`http://localhost/api/v1/share-links/${shareToken}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      }),
      { params: Promise.resolve({ token: shareToken }) },
    );
    expect(revokeRes.status).toBe(204);

    const publicRes = await getShare(
      new Request(`http://localhost/api/v1/shares/${shareToken}`),
      { params: Promise.resolve({ token: shareToken }) },
    );
    expect(publicRes.status).toBe(410);
  });

  it("소유자가 아니면 철회할 수 없다 (404)", async () => {
    const { token, id } = await setup();
    const createRes = await createShareLink(
      new Request(`http://localhost/api/v1/recommendations/${id}/share-links`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ scope: "basic" }),
      }),
      { params: Promise.resolve({ id }) },
    );
    const { token: shareToken } = await createRes.json();

    const otherSessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken: otherToken } = await otherSessionRes.json();

    const revokeRes = await deleteShareLink(
      new Request(`http://localhost/api/v1/share-links/${shareToken}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${otherToken}` },
      }),
      { params: Promise.resolve({ token: shareToken }) },
    );
    expect(revokeRes.status).toBe(404);
  });

  it("five-elements 범위는 오행 분석이 없으면 400을 반환한다", async () => {
    const { token, id } = await setup();
    const res = await createShareLink(
      new Request(`http://localhost/api/v1/recommendations/${id}/share-links`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ scope: "five-elements" }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(400);
  });
});
