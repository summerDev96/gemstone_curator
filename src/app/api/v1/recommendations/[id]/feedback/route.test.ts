import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("../../basic/route");
const { POST: submitFeedback } = await import("./route");

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

describe("POST /api/v1/recommendations/[id]/feedback", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1~5 범위를 벗어나면 400을 반환한다", async () => {
    const { token, id } = await setup();
    const res = await submitFeedback(
      new Request(`http://localhost/api/v1/recommendations/${id}/feedback`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ rating: 6 }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(400);
  });

  it("정상 제출 시 201을 반환한다", async () => {
    const { token, id } = await setup();
    const res = await submitFeedback(
      new Request(`http://localhost/api/v1/recommendations/${id}/feedback`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ rating: 5, comment: "좋아요" }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(res.status).toBe(201);
  });

  it("동일 결과에 중복 제출하면 409를 반환한다", async () => {
    const { token, id } = await setup();
    await submitFeedback(
      new Request(`http://localhost/api/v1/recommendations/${id}/feedback`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ rating: 4 }),
      }),
      { params: Promise.resolve({ id }) },
    );
    const second = await submitFeedback(
      new Request(`http://localhost/api/v1/recommendations/${id}/feedback`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ rating: 3 }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(second.status).toBe(409);
  });
});
