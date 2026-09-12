import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST as issueSession } from "../../sessions/route";
import { GET } from "./route";

async function getSessionToken(): Promise<string> {
  const res = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const body = await res.json();
  return body.sessionToken;
}

describe("GET /api/v1/catalog/wishes", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("세션 없이 호출하면 401을 반환한다", async () => {
    const res = await GET(new Request("http://localhost/api/v1/catalog/wishes"));
    expect(res.status).toBe(401);
  });

  it("유효한 세션으로 호출하면 소원/감정 태그 목록을 반환한다", async () => {
    const token = await getSessionToken();
    const res = await GET(
      new Request("http://localhost/api/v1/catalog/wishes", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.wishes)).toBe(true);
    expect(Array.isArray(body.emotions)).toBe(true);
    expect(body.wishes.length).toBeGreaterThan(0);
    expect(body.emotions.length).toBeGreaterThan(0);
    expect(body.wishes[0]).toHaveProperty("id");
    expect(body.wishes[0]).toHaveProperty("labelKo");
  });
});
