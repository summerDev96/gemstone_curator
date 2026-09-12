import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "./db";
import { createMockLLMProvider } from "./llm/testUtils";
import { cleanupExpiredSessions, deleteAllDataForSession } from "./dataDeletion";
import { generateToken, hashToken } from "./crypto/tokenHash";

vi.mock("./llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: issueSession } = await import(
  "@/app/api/v1/sessions/route"
);
const { POST: createRecommendation } = await import(
  "@/app/api/v1/recommendations/basic/route"
);
const { POST: submitFiveElements } = await import(
  "@/app/api/v1/recommendations/[id]/five-elements/route"
);
const { POST: createShareLink } = await import(
  "@/app/api/v1/recommendations/[id]/share-links/route"
);

async function createFullSession(): Promise<{
  sessionId: string;
  sessionToken: string;
  recommendationId: string;
  fiveElementProfileId: string;
  shareToken: string;
}> {
  const sessionRes = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const { sessionId, sessionToken } = await sessionRes.json();

  const primary = await prisma.tag.findFirstOrThrow({ where: { category: "WISH" } });
  const heart = await prisma.tag.findFirstOrThrow({ where: { category: "EMOTION" } });
  const recRes = await createRecommendation(
    new Request("http://localhost/api/v1/recommendations/basic", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({ primaryWishTagId: primary.id, heartTagId: heart.id }),
    }),
  );
  const { id: recommendationId } = await recRes.json();

  const feRes = await submitFiveElements(
    new Request(`http://localhost/api/v1/recommendations/${recommendationId}/five-elements`, {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({
        consent: true,
        consentVersion: "test-consent-1",
        calendarType: "SOLAR",
        birthDate: "1996-04-12",
        birthTimeUnknown: true,
      }),
    }),
    { params: Promise.resolve({ id: recommendationId }) },
  );
  const { fiveElementProfileId } = await feRes.json();

  const shareRes = await createShareLink(
    new Request(`http://localhost/api/v1/recommendations/${recommendationId}/share-links`, {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}`, "content-type": "application/json" },
      body: JSON.stringify({ scope: "basic" }),
    }),
    { params: Promise.resolve({ id: recommendationId }) },
  );
  const { token: shareToken } = await shareRes.json();

  return { sessionId, sessionToken, recommendationId, fiveElementProfileId, shareToken };
}

describe("deleteAllDataForSession", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("FK 제약 위반 없이 오행 프로필/동의/추천/공유링크/세션을 모두 삭제한다", async () => {
    const { sessionId, recommendationId, fiveElementProfileId, shareToken } =
      await createFullSession();

    await expect(deleteAllDataForSession(sessionId)).resolves.toEqual({
      deletedFiveElementProfiles: 1,
      deletedSession: true,
    });

    expect(await prisma.anonymousSession.findUnique({ where: { id: sessionId } })).toBeNull();
    expect(
      await prisma.recommendation.findUnique({ where: { id: recommendationId } }),
    ).toBeNull();
    expect(
      await prisma.fiveElementProfile.findUnique({ where: { id: fiveElementProfileId } }),
    ).toBeNull();
    expect(
      await prisma.consentRecord.findMany({ where: { anonymousSessionId: sessionId } }),
    ).toHaveLength(0);
    expect(
      await prisma.shareLink.findUnique({ where: { tokenHash: hashToken(shareToken) } }),
    ).toBeNull();
  });

  it("오행 분석이 없는 세션도 정상 삭제된다 (fiveElementProfile 0건)", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionId } = await sessionRes.json();

    await expect(deleteAllDataForSession(sessionId)).resolves.toEqual({
      deletedFiveElementProfiles: 0,
      deletedSession: true,
    });
    expect(await prisma.anonymousSession.findUnique({ where: { id: sessionId } })).toBeNull();
  });

  it("이미 삭제된 세션 id로 다시 호출해도 예외 없이 멱등하게 처리된다 (동시 정리 경합 대응)", async () => {
    const sessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionId } = await sessionRes.json();

    await deleteAllDataForSession(sessionId);

    await expect(deleteAllDataForSession(sessionId)).resolves.toEqual({
      deletedFiveElementProfiles: 0,
      deletedSession: false,
    });
  });
});

describe("cleanupExpiredSessions", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("만료된 세션만 삭제하고 유효한 세션은 남겨둔다", async () => {
    const expiredToken = generateToken("sst");
    const expired = await prisma.anonymousSession.create({
      data: {
        sessionTokenHash: hashToken(expiredToken),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const validRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionId: validId } = await validRes.json();

    const result = await cleanupExpiredSessions();
    expect(result.deletedSessions).toBeGreaterThanOrEqual(1);

    expect(await prisma.anonymousSession.findUnique({ where: { id: expired.id } })).toBeNull();
    expect(await prisma.anonymousSession.findUnique({ where: { id: validId } })).not.toBeNull();
  });
});
