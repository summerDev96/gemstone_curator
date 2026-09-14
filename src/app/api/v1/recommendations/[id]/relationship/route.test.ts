import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { decryptField, encryptField } from "@/lib/crypto/envelope";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("../../basic/route");
const { POST: submitRelationship } = await import("./route");

const MY_BIRTH_INFO = {
  calendarType: "SOLAR" as const,
  birthDate: "1996-04-12",
  birthTimeUnknown: true,
};
const PARTNER_BIRTH_INFO = {
  calendarType: "SOLAR" as const,
  birthDate: "1998-07-20",
  birthTimeUnknown: true,
};

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

function postRelationship(token: string, id: string, body: unknown) {
  return submitRelationship(
    new Request(`http://localhost/api/v1/recommendations/${id}/relationship`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function relationshipGoalTagId(): Promise<string> {
  const tag = await prisma.tag.findFirstOrThrow({ where: { category: "RELATIONSHIP_GOAL" } });
  return tag.id;
}

/** 이미 오행 분석(S08)까지 마친 추천을 만든다. 오행 통합 원석은 기본 원석과 다르게 강제한다. */
async function setupWithFiveElementProfile(): Promise<{
  token: string;
  id: string;
  basicStoneId: string;
  integratedStoneId: string;
}> {
  const { token, id } = await setup();
  const recommendation = await prisma.recommendation.findUniqueOrThrow({ where: { id } });
  const integratedStone = await prisma.stone.findFirstOrThrow({
    where: { isActive: true, id: { not: recommendation.stoneId } },
  });

  const consent = await prisma.consentRecord.create({
    data: {
      anonymousSessionId: (
        await prisma.wishSession.findUniqueOrThrow({ where: { id: recommendation.wishSessionId } })
      ).anonymousSessionId,
      consentType: "FIVE_ELEMENTS_BIRTH_INFO",
      consentVersion: "test-consent",
      granted: true,
      grantedAt: new Date(),
    },
  });
  const profile = await prisma.fiveElementProfile.create({
    data: {
      birthDateEncrypted: encryptField("1996-04-12"),
      calendarType: "SOLAR",
      birthTimeUnknown: true,
      computedElement: "FIRE",
      balanceJson: {},
      integratedStoneId: integratedStone.id,
      consentRecordId: consent.id,
    },
  });
  await prisma.recommendation.update({
    where: { id },
    data: { fiveElementProfileId: profile.id },
  });

  return {
    token,
    id,
    basicStoneId: recommendation.stoneId,
    integratedStoneId: integratedStone.id,
  };
}

describe("POST /api/v1/recommendations/[id]/relationship", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("나와 상대방의 생년월일시를 모두 받아야 관계 원석 결과가 생성된다", async () => {
    const { token, id } = await setup();
    const goalTagId = await relationshipGoalTagId();
    const res = await postRelationship(token, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "민지",
      myBirthInfo: MY_BIRTH_INFO,
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.relationshipAnalysisId).toBeTruthy();
    expect(body.weStone.nameKo).toBeTruthy();
    expect(body.myStone.nameKo).toBeTruthy();
    expect(body.partnerStone.nameKo).toBeTruthy();
    expect(body.conversationPrompt).toBeTruthy();
    expect(body.microAction).toBeTruthy();

    const stored = await prisma.relationshipAnalysis.findUniqueOrThrow({
      where: { id: body.relationshipAnalysisId },
    });
    expect(stored.partnerBirthProvided).toBe(true);
    expect(stored.partnerFiveElementProfileId).toBeTruthy();

    const profile = await prisma.fiveElementProfile.findUniqueOrThrow({
      where: { id: stored.partnerFiveElementProfileId! },
    });
    expect(profile.heartSummary).toBeNull();
    expect(decryptField(new Uint8Array(Buffer.from(profile.birthDateEncrypted)))).toBe(
      "1998-07-20",
    );

    // 이 요청으로 나의 오행도 처음 계산되어 Recommendation에 연결된다.
    const recommendation = await prisma.recommendation.findUniqueOrThrow({ where: { id } });
    expect(recommendation.fiveElementProfileId).toBeTruthy();
  });

  it("이미 오행 분석을 마쳤다면 myBirthInfo 없이 상대방 정보만으로 진행된다", async () => {
    const { token, id, basicStoneId, integratedStoneId } = await setupWithFiveElementProfile();
    const goalTagId = await relationshipGoalTagId();
    const res = await postRelationship(token, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "민지",
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.myStone.id).toBe(integratedStoneId);
    expect(body.myStone.id).not.toBe(basicStoneId);
    expect(body.partnerStone.nameKo).toBeTruthy();
  });

  it("오행 분석을 마치지 않았는데 myBirthInfo가 없으면 400을 반환한다", async () => {
    const { token, id } = await setup();
    const goalTagId = await relationshipGoalTagId();
    const res = await postRelationship(token, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "민지",
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    expect(res.status).toBe(400);
  });

  it("partnerBirthInfo 없이 요청하면 400을 반환한다", async () => {
    const { token, id } = await setup();
    const goalTagId = await relationshipGoalTagId();
    const res = await postRelationship(token, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "민지",
      myBirthInfo: MY_BIRTH_INFO,
    });
    expect(res.status).toBe(400);
  });

  it("상대방 별명은 암호화되어 저장되고 평문으로 응답에 노출되지 않는다", async () => {
    const { token, id } = await setup();
    const goalTagId = await relationshipGoalTagId();
    const res = await postRelationship(token, id, {
      relationshipType: "FAMILY",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "은하수",
      myBirthInfo: MY_BIRTH_INFO,
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("은하수");

    const stored = await prisma.relationshipAnalysis.findUniqueOrThrow({
      where: { id: body.relationshipAnalysisId },
    });
    expect(decryptField(new Uint8Array(Buffer.from(stored.partnerNicknameEncrypted)))).toBe(
      "은하수",
    );
  });

  it("존재하지 않는 관계 목표 태그면 404를 반환한다", async () => {
    const { token, id } = await setup();
    const res = await postRelationship(token, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: "00000000-0000-0000-0000-000000000000",
      partnerNickname: "민지",
      myBirthInfo: MY_BIRTH_INFO,
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    expect(res.status).toBe(404);
  });

  it("소유자가 아니면 404를 반환한다", async () => {
    const { id } = await setup();
    const goalTagId = await relationshipGoalTagId();
    const otherSessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken: otherToken } = await otherSessionRes.json();
    const res = await postRelationship(otherToken, id, {
      relationshipType: "FRIEND",
      relationshipGoalTagId: goalTagId,
      partnerNickname: "민지",
      myBirthInfo: MY_BIRTH_INFO,
      partnerBirthInfo: PARTNER_BIRTH_INFO,
    });
    expect(res.status).toBe(404);
  });
});
