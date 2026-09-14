import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { encryptField } from "@/lib/crypto/envelope";
import { prisma } from "@/lib/db";
import { recommend } from "@/lib/engine";
import { calculateFiveElements } from "@/lib/fiveElements/calculate";
import { createFiveElementProfileForRecommendation } from "@/lib/fiveElements/createProfile";
import { generateRelationshipCopy } from "@/lib/llm/generateRelationshipCopy";
import { getLLMProvider } from "@/lib/llm/getProvider";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveSession } from "@/lib/session";
import { RelationshipRequestSchema } from "@/lib/validation/relationship";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

const CURRENT_RELATIONSHIP_CONSENT_VERSION = "relationship-partner-consent-2026-09-12";
const MY_BIRTH_INFO_CONSENT_VERSION = "relationship-my-birth-consent-2026-09-13";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const llm = getLLMProvider();
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(`relationship:${session.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const { id } = await context.params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: { wishSession: true, fiveElementProfile: true },
  });
  if (
    !recommendation ||
    recommendation.wishSession.anonymousSessionId !== session.id
  ) {
    return apiError("NOT_FOUND", "결과를 찾을 수 없습니다.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "요청 본문이 유효한 JSON이 아닙니다.");
  }

  const parsed = RelationshipRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }
  const body = parsed.data;

  // 관계 원석은 나와 상대방의 사주를 함께 비교하는 기능이므로, 이미 오행 분석(S08)을
  // 마친 추천이 아니라면 내 생년월일시도 이 요청에 반드시 포함되어야 한다.
  if (!recommendation.fiveElementProfile && !body.myBirthInfo) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      { myBirthInfo: ["나의 생년월일시가 필요합니다."] },
    );
  }

  const relationshipGoalTag = await prisma.tag.findUnique({
    where: { id: body.relationshipGoalTagId },
  });
  if (!relationshipGoalTag || relationshipGoalTag.category !== "RELATIONSHIP_GOAL") {
    return apiError("NOT_FOUND", "존재하지 않는 관계 목표입니다.");
  }

  const [stones, stoneTags] = await Promise.all([
    prisma.stone.findMany({ where: { isActive: true } }),
    prisma.stoneTag.findMany(),
  ]);
  const engineStones = stones.map((s) => ({ id: s.id, slug: s.slug, element: s.element }));
  const engineStoneTags = stoneTags.map((st) => ({
    stoneId: st.stoneId,
    tagId: st.tagId,
    weight: st.weight,
  }));

  // 1. 나의 오행 — 이미 마쳤다면 재사용하고, 아니라면 이 요청에서 처음 계산한다(S06~S08과 동일한 로직).
  let myNeededElement = recommendation.fiveElementProfile?.computedElement;
  let myStoneId = recommendation.fiveElementProfile?.integratedStoneId ?? null;
  if (!recommendation.fiveElementProfile && body.myBirthInfo) {
    const { profile, integratedStone } = await createFiveElementProfileForRecommendation({
      recommendationId: recommendation.id,
      wishSession: recommendation.wishSession,
      anonymousSessionId: session.id,
      birthInfo: body.myBirthInfo,
      consentVersion: MY_BIRTH_INFO_CONSENT_VERSION,
      stones,
      stoneTags: engineStoneTags,
      llm,
    });
    myNeededElement = profile.computedElement;
    myStoneId = integratedStone.id;
  }
  if (!myStoneId || !myNeededElement) {
    // 스키마 검증을 통과했다면 도달할 수 없는 상태(방어적 처리).
    return apiError("VALIDATION_ERROR", "나의 생년월일시가 필요합니다.");
  }

  // 2. 상대방의 오행 — 관계 원석은 항상 상대방의 생년월일시도 함께 받는다.
  const [py, pm, pd] = body.partnerBirthInfo.birthDate.split("-").map(Number);
  const [ph, pmin] = body.partnerBirthInfo.birthTimeUnknown
    ? [undefined, undefined]
    : (body.partnerBirthInfo.birthTime ?? "").split(":").map(Number);

  const partnerElements = calculateFiveElements({
    calendarType: body.partnerBirthInfo.calendarType,
    year: py,
    month: pm,
    day: pd,
    isLeapMonth: body.partnerBirthInfo.isLeapMonth,
    birthTimeUnknown: body.partnerBirthInfo.birthTimeUnknown,
    hour: ph,
    minute: pmin,
  });

  const partnerEngineResult = recommend(
    {
      context: "partner-five-elements",
      wish: {},
      fiveElement: {
        neededElement: partnerElements.neededElement,
        secondaryNeededElement: partnerElements.secondaryNeededElement,
      },
    },
    engineStones,
    engineStoneTags,
  );
  const partnerStoneId = partnerEngineResult.stoneId;

  const partnerConsent = await prisma.consentRecord.create({
    data: {
      anonymousSessionId: session.id,
      consentType: "RELATIONSHIP_PARTNER_INFO",
      consentVersion: CURRENT_RELATIONSHIP_CONSENT_VERSION,
      granted: true,
      grantedAt: new Date(),
    },
  });

  const partnerProfile = await prisma.fiveElementProfile.create({
    data: {
      birthDateEncrypted: encryptField(body.partnerBirthInfo.birthDate),
      calendarType: body.partnerBirthInfo.calendarType,
      isLeapMonth: body.partnerBirthInfo.isLeapMonth ?? false,
      birthTimeUnknown: body.partnerBirthInfo.birthTimeUnknown,
      birthTimeEncrypted:
        !body.partnerBirthInfo.birthTimeUnknown && body.partnerBirthInfo.birthTime
          ? encryptField(body.partnerBirthInfo.birthTime)
          : null,
      computedElement: partnerElements.neededElement,
      balanceJson: partnerElements.balance,
      integratedStoneId: partnerStoneId,
      consentRecordId: partnerConsent.id,
    },
  });

  // 3. 우리의 원석 — 나의 소원/감정 + 나와 상대방의 오행(둘 다 항상 있음) + 관계 목표를 결합한다.
  const weEngineResult = recommend(
    {
      context: "relationship",
      wish: {
        primaryWishTagId: recommendation.wishSession.primaryWishTagId,
        secondaryWishTagId: recommendation.wishSession.secondaryWishTagId ?? undefined,
        heartTagId: recommendation.wishSession.heartTagId,
      },
      fiveElement: {
        neededElement: myNeededElement,
        partnerNeededElement: partnerElements.neededElement,
      },
      relationship: { relationshipGoalTagId: body.relationshipGoalTagId },
    },
    engineStones,
    engineStoneTags,
  );
  const weStoneId = weEngineResult.stoneId;

  const [myStone, weStone, partnerStone] = await Promise.all([
    prisma.stone.findUniqueOrThrow({ where: { id: myStoneId } }),
    prisma.stone.findUniqueOrThrow({ where: { id: weStoneId } }),
    prisma.stone.findUniqueOrThrow({ where: { id: partnerStoneId } }),
  ]);

  const otherStoneNames = stones
    .filter((s) => ![myStoneId, weStoneId, partnerStoneId].includes(s.id))
    .flatMap((s) => [s.nameKo, s.nameEn]);

  const generated = await generateRelationshipCopy(
    {
      weStoneSlug: weStone.slug,
      myStoneNameKo: myStone.nameKo,
      partnerStoneNameKo: partnerStone.nameKo,
      weStoneNameKo: weStone.nameKo,
      weStoneSummary: weStone.summary,
      relationshipType: body.relationshipType,
      relationshipGoalLabel: relationshipGoalTag.labelKo,
      partnerNickname: body.partnerNickname,
      otherStoneNames,
    },
    llm,
  );

  const relationshipAnalysis = await prisma.relationshipAnalysis.create({
    data: {
      recommendationId: recommendation.id,
      relationshipType: body.relationshipType,
      relationshipGoalTagId: body.relationshipGoalTagId,
      partnerNicknameEncrypted: encryptField(body.partnerNickname),
      partnerBirthProvided: true,
      partnerFiveElementProfileId: partnerProfile.id,
      myStoneId,
      partnerStoneId,
      weStoneId,
      conversationPrompt: generated.copy.conversationPrompt,
      microAction: generated.copy.microAction,
      usedFallback: generated.usedFallback,
      promptVersion: generated.promptVersion,
      modelName: generated.modelName,
    },
  });

  return NextResponse.json(
    {
      relationshipAnalysisId: relationshipAnalysis.id,
      myStone: { id: myStone.id, nameKo: myStone.nameKo, nameEn: myStone.nameEn, colorHex: myStone.colorHex, imageUrl: myStone.imageUrl },
      partnerStone: { id: partnerStone.id, nameKo: partnerStone.nameKo, nameEn: partnerStone.nameEn, colorHex: partnerStone.colorHex, imageUrl: partnerStone.imageUrl },
      weStone: { id: weStone.id, nameKo: weStone.nameKo, nameEn: weStone.nameEn, colorHex: weStone.colorHex, imageUrl: weStone.imageUrl },
      conversationPrompt: relationshipAnalysis.conversationPrompt,
      microAction: relationshipAnalysis.microAction,
      usedFallback: relationshipAnalysis.usedFallback,
    },
    { status: 201 },
  );
}
