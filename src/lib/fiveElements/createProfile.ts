import type { FiveElementProfile, Stone } from "@prisma/client";
import { prisma } from "@/lib/db";
import { encryptField } from "@/lib/crypto/envelope";
import { recommend } from "@/lib/engine";
import { generateFiveElementsCopy } from "@/lib/llm/generateFiveElementsCopy";
import type { LLMProvider } from "@/lib/llm/provider";
import { calculateFiveElements, type CalendarType } from "./calculate";

interface BirthInfo {
  calendarType: CalendarType;
  birthDate: string;
  isLeapMonth?: boolean;
  birthTimeUnknown: boolean;
  birthTime?: string;
}

interface CreateFiveElementProfileParams {
  recommendationId: string;
  wishSession: {
    primaryWishTagId: string;
    secondaryWishTagId: string | null;
    heartTagId: string;
  };
  anonymousSessionId: string;
  birthInfo: BirthInfo;
  consentVersion: string;
  stones: Stone[];
  stoneTags: { stoneId: string; tagId: string; weight: number }[];
  llm: LLMProvider;
}

/**
 * S06~S08(오행 안내→입력→통합 결과)과 관계 원석에서 "내 생년월일시"를 처음
 * 입력하는 경우 양쪽에서 공유하는 생성 로직. 결과를 `Recommendation.fiveElementProfileId`에
 * 연결해, 이후 어느 화면에서 봐도 동일한 오행 통합 원석을 일관되게 보여준다.
 */
export async function createFiveElementProfileForRecommendation({
  recommendationId,
  wishSession,
  anonymousSessionId,
  birthInfo,
  consentVersion,
  stones,
  stoneTags,
  llm,
}: CreateFiveElementProfileParams): Promise<{
  profile: FiveElementProfile;
  integratedStone: Stone;
}> {
  const [year, month, day] = birthInfo.birthDate.split("-").map(Number);
  const [hour, minute] = birthInfo.birthTimeUnknown
    ? [undefined, undefined]
    : (birthInfo.birthTime ?? "").split(":").map(Number);

  const fiveElements = calculateFiveElements({
    calendarType: birthInfo.calendarType,
    year,
    month,
    day,
    isLeapMonth: birthInfo.isLeapMonth,
    birthTimeUnknown: birthInfo.birthTimeUnknown,
    hour,
    minute,
  });

  const primaryWishTag = await prisma.tag.findUniqueOrThrow({
    where: { id: wishSession.primaryWishTagId },
  });

  const engineResult = recommend(
    {
      context: "five-elements",
      wish: {
        primaryWishTagId: wishSession.primaryWishTagId,
        secondaryWishTagId: wishSession.secondaryWishTagId ?? undefined,
        heartTagId: wishSession.heartTagId,
      },
      fiveElement: {
        neededElement: fiveElements.neededElement,
        secondaryNeededElement: fiveElements.secondaryNeededElement,
      },
    },
    stones.map((s) => ({ id: s.id, slug: s.slug, element: s.element })),
    stoneTags,
  );

  const integratedStone = stones.find((s) => s.id === engineResult.stoneId)!;
  const otherStoneNames = stones
    .filter((s) => s.id !== integratedStone.id)
    .flatMap((s) => [s.nameKo, s.nameEn]);

  const generated = await generateFiveElementsCopy(
    {
      stoneSlug: integratedStone.slug,
      stoneNameKo: integratedStone.nameKo,
      stoneNameEn: integratedStone.nameEn,
      stoneSummary: integratedStone.summary,
      stoneDescription: integratedStone.description,
      neededElement: fiveElements.neededElement,
      balance: fiveElements.balance,
      primaryWishLabel: primaryWishTag.labelKo,
      otherStoneNames,
    },
    llm,
  );

  const consentRecord = await prisma.consentRecord.create({
    data: {
      anonymousSessionId,
      consentType: "FIVE_ELEMENTS_BIRTH_INFO",
      consentVersion,
      granted: true,
      grantedAt: new Date(),
    },
  });

  const birthTimeEncrypted =
    !birthInfo.birthTimeUnknown && birthInfo.birthTime
      ? encryptField(birthInfo.birthTime)
      : null;

  const profile = await prisma.fiveElementProfile.create({
    data: {
      birthDateEncrypted: encryptField(birthInfo.birthDate),
      calendarType: birthInfo.calendarType,
      isLeapMonth: birthInfo.isLeapMonth ?? false,
      birthTimeUnknown: birthInfo.birthTimeUnknown,
      birthTimeEncrypted,
      computedElement: fiveElements.neededElement,
      balanceJson: fiveElements.balance,
      integratedStoneId: integratedStone.id,
      heartSummary: generated.copy.heartSummary,
      rationale: generated.copy.rationale,
      comfortLines: generated.copy.comfortLines,
      microAction: generated.copy.microAction,
      usedFallback: generated.usedFallback,
      promptVersion: generated.promptVersion,
      modelName: generated.modelName,
      consentRecordId: consentRecord.id,
    },
  });

  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { fiveElementProfileId: profile.id },
  });

  return { profile, integratedStone };
}
