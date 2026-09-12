import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { POST } from "./route";

describe("POST /api/v1/sessions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("세션을 발급하고 토큰 원문은 응답에만 노출하며 DB에는 해시만 저장한다", async () => {
    const request = new Request("http://localhost/api/v1/sessions", {
      method: "POST",
    });
    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.sessionId).toBeTruthy();
    expect(body.sessionToken).toMatch(/^sst_[0-9a-f]{64}$/);
    expect(body.expiresAt).toBeTruthy();

    const stored = await prisma.anonymousSession.findUnique({
      where: { id: body.sessionId },
    });
    expect(stored).not.toBeNull();
    expect(stored?.sessionTokenHash).not.toBe(body.sessionToken);
    expect(stored?.sessionTokenHash).toHaveLength(64);
  });

  it("호출마다 서로 다른 세션을 발급한다", async () => {
    const r1 = await POST(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const r2 = await POST(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const b1 = await r1.json();
    const b2 = await r2.json();
    expect(b1.sessionId).not.toBe(b2.sessionId);
  });
});
