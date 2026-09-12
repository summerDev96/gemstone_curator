import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { generateToken, hashToken } from "./crypto/tokenHash";
import { resolveSession } from "./session";

describe("resolveSession", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("만료된 세션은 null을 반환하고 해당 세션 데이터를 즉시 삭제한다", async () => {
    const token = generateToken("sst");
    const expired = await prisma.anonymousSession.create({
      data: {
        sessionTokenHash: hashToken(token),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const result = await resolveSession(
      new Request("http://localhost/api/v1/sessions", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );

    expect(result).toBeNull();
    expect(
      await prisma.anonymousSession.findUnique({ where: { id: expired.id } }),
    ).toBeNull();
  });

  it("존재하지 않는 토큰은 null을 반환한다", async () => {
    const result = await resolveSession(
      new Request("http://localhost/api/v1/sessions", {
        headers: { authorization: "Bearer sst_doesnotexist" },
      }),
    );
    expect(result).toBeNull();
  });
});
