import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto/envelope";
import { createMockLLMProvider } from "@/lib/llm/testUtils";
import { POST as issueSession } from "../../../sessions/route";

vi.mock("@/lib/llm/getProvider", () => ({
  getLLMProvider: () => createMockLLMProvider(),
}));

const { POST: createRecommendation } = await import("../../basic/route");
const { POST: submitFiveElements } = await import("./route");

async function setup(): Promise<{ token: string; sessionId: string; id: string }> {
  const sessionRes = await issueSession(
    new Request("http://localhost/api/v1/sessions", { method: "POST" }),
  );
  const { sessionId, sessionToken } = await sessionRes.json();
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
  return { token: sessionToken, sessionId, id };
}

function postFiveElements(token: string, id: string, body: unknown) {
  return submitFiveElements(
    new Request(`http://localhost/api/v1/recommendations/${id}/five-elements`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

const validBody = {
  consent: true,
  consentVersion: "five-elements-consent-2026-09-11",
  calendarType: "SOLAR",
  birthDate: "1996-04-12",
  birthTimeUnknown: true,
};

describe("POST /api/v1/recommendations/[id]/five-elements", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("동의 없이(consent 누락) 요청하면 400을 반환한다", async () => {
    const { token, id } = await setup();
    const res = await postFiveElements(token, id, { ...validBody, consent: undefined });
    expect(res.status).toBe(400);
  });

  it("출생시간 미상으로 제출하면 시주 없이 결과가 생성된다", async () => {
    const { token, id } = await setup();
    const res = await postFiveElements(token, id, validBody);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.fiveElementProfileId).toBeTruthy();
    expect(body.integratedStone.nameKo).toBeTruthy();
    expect(body.heartSummary).toBeTruthy();
    expect(body.rationale).toBeTruthy();

    const stored = await prisma.fiveElementProfile.findUniqueOrThrow({
      where: { id: body.fiveElementProfileId },
    });
    expect(stored.birthTimeUnknown).toBe(true);
    expect(stored.birthTimeEncrypted).toBeNull();
  });

  it("생년월일시 원문은 DB에 암호화되어 저장되고 평문으로 노출되지 않는다", async () => {
    const { token, id } = await setup();
    const res = await postFiveElements(token, id, {
      ...validBody,
      birthTimeUnknown: false,
      birthTime: "14:30",
    });
    const body = await res.json();
    const stored = await prisma.fiveElementProfile.findUniqueOrThrow({
      where: { id: body.fiveElementProfileId },
    });

    const rawBytes = Buffer.from(stored.birthDateEncrypted);
    expect(rawBytes.toString("utf8")).not.toContain("1996-04-12");
    expect(decryptField(new Uint8Array(rawBytes))).toBe("1996-04-12");

    const rawTimeBytes = Buffer.from(stored.birthTimeEncrypted!);
    expect(decryptField(new Uint8Array(rawTimeBytes))).toBe("14:30");

    // API 응답에도 생년월일시 원문이 포함되지 않아야 한다
    expect(JSON.stringify(body)).not.toContain("1996-04-12");
    expect(JSON.stringify(body)).not.toContain("14:30");
  });

  it("동의 기록이 ConsentRecord로 남는다", async () => {
    const { token, sessionId, id } = await setup();
    await postFiveElements(token, id, validBody);
    const consents = await prisma.consentRecord.findMany({
      where: { anonymousSessionId: sessionId, consentType: "FIVE_ELEMENTS_BIRTH_INFO" },
    });
    expect(consents.length).toBeGreaterThanOrEqual(1);
    expect(consents[0].granted).toBe(true);
  });

  it("이미 오행 분석이 있으면 재요청 시 409를 반환한다", async () => {
    const { token, id } = await setup();
    await postFiveElements(token, id, validBody);
    const second = await postFiveElements(token, id, validBody);
    expect(second.status).toBe(409);
  });

  it("소유자가 아니면 404를 반환한다", async () => {
    const { id } = await setup();
    const otherSessionRes = await issueSession(
      new Request("http://localhost/api/v1/sessions", { method: "POST" }),
    );
    const { sessionToken: otherToken } = await otherSessionRes.json();
    const res = await postFiveElements(otherToken, id, validBody);
    expect(res.status).toBe(404);
  });
});
