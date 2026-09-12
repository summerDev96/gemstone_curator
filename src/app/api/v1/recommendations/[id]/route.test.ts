import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("../basic/route");
const { GET } = await import("./route");

async function issueSessionToken(): Promise<string> {
  const res = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  return (await res.json()).sessionToken;
}

async function createOneRecommendation(token: string): Promise<string> {
  const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
  const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });
  const res = await createRecommendation(
    new Request("http://localhost/api/v1/recommendations/basic", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ primaryWishTagId: primary.id, heartTagId: heart.id }),
    }),
  );
  return (await res.json()).id;
}

describe("GET /api/v1/recommendations/[id]", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("소유자가 아니면 404를 반환한다 (SEC-05: 존재 여부 비노출)", async () => {
    const ownerToken = await issueSessionToken();
    const id = await createOneRecommendation(ownerToken);

    const otherToken = await issueSessionToken();
    const res = await GET(
      new Request(`http://localhost/api/v1/recommendations/${id}`, {
        headers: { authorization: `Bearer ${otherToken}` },
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(404);
  });

  it("소유자는 자신의 결과를 조회할 수 있다", async () => {
    const token = await issueSessionToken();
    const id = await createOneRecommendation(token);

    const res = await GET(
      new Request(`http://localhost/api/v1/recommendations/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(id);
    expect(body.stone.nameKo).toBeTruthy();
  });

  it("존재하지 않는 id는 404를 반환한다", async () => {
    const token = await issueSessionToken();
    const res = await GET(
      new Request("http://localhost/api/v1/recommendations/00000000-0000-0000-0000-000000000000", {
        headers: { authorization: `Bearer ${token}` },
      }),
      { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) },
    );
    expect(res.status).toBe(404);
  });
});
