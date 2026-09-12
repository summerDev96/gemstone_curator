import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { encryptField } from "@/lib/crypto/envelope";
import { prisma } from "@/lib/db";
import { recommend } from "@/lib/engine";
import { calculateFiveElements } from "@/lib/fiveElements/calculate";
import { generateFiveElementsCopy } from "@/lib/llm/generateFiveElementsCopy";
import { getLLMProvider } from "@/lib/llm/getProvider";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveSession } from "@/lib/session";
import { FiveElementsRequestSchema } from "@/lib/validation/fiveElements";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

const RECENT_STONE_WINDOW = 3;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const llm = getLLMProvider();
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(`five-elements:${session.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  const { id } = await context.params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: { wishSession: true },
  });
  if (
    !recommendation ||
    recommendation.wishSession.anonymousSessionId !== session.id
  ) {
    return apiError("NOT_FOUND", "결과를 찾을 수 없습니다.");
  }
  if (recommendation.fiveElementProfileId) {
    return apiError("CONFLICT", "이미 오행 분석이 생성되어 있습니다.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "요청 본문이 유효한 JSON이 아닙니다.");
  }

  const parsed = FiveElementsRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }
  const body = parsed.data;
  const [year, month, day] = body.birthDate.split("-").map(Number);
  const [hour, minute] = body.birthTimeUnknown
    ? [undefined, undefined]
    : (body.birthTime ?? "").split(":").map(Number);

  const fiveElements = calculateFiveElements({
    calendarType: body.calendarType,
    year,
    month,
    day,
    isLeapMonth: body.isLeapMonth,
    birthTimeUnknown: body.birthTimeUnknown,
    hour,
    minute,
  });

  const primaryWishTag = await prisma.tag.findUniqueOrThrow({
    where: { id: recommendation.wishSession.primaryWishTagId },
  });

  const [stones, stoneTags, recentRecommendations] = await Promise.all([
    prisma.stone.findMany({ where: { isActive: true } }),
    prisma.stoneTag.findMany(),
    prisma.recommendation.findMany({
      where: { wishSession: { anonymousSessionId: session.id } },
      orderBy: { createdAt: "desc" },
      take: RECENT_STONE_WINDOW,
      select: { stoneId: true },
    }),
  ]);

  const engineResult = recommend(
    {
      context: "five-elements",
      wish: {
        primaryWishTagId: recommendation.wishSession.primaryWishTagId,
        secondaryWishTagId: recommendation.wishSession.secondaryWishTagId ?? undefined,
        heartTagId: recommendation.wishSession.heartTagId,
      },
      fiveElement: { neededElement: fiveElements.neededElement },
      recentStoneIds: recentRecommendations.map((r) => r.stoneId),
    },
    stones.map((s) => ({ id: s.id, slug: s.slug, element: s.element })),
    stoneTags.map((st) => ({
      stoneId: st.stoneId,
      tagId: st.tagId,
      weight: st.weight,
    })),
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
      anonymousSessionId: session.id,
      consentType: "FIVE_ELEMENTS_BIRTH_INFO",
      consentVersion: body.consentVersion,
      granted: true,
      grantedAt: new Date(),
    },
  });

  const birthDateEncrypted = encryptField(body.birthDate);
  const birthTimeEncrypted =
    !body.birthTimeUnknown && body.birthTime
      ? encryptField(body.birthTime)
      : null;

  const profile = await prisma.fiveElementProfile.create({
    data: {
      birthDateEncrypted,
      calendarType: body.calendarType,
      isLeapMonth: body.isLeapMonth ?? false,
      birthTimeUnknown: body.birthTimeUnknown,
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
    where: { id: recommendation.id },
    data: { fiveElementProfileId: profile.id },
  });

  return NextResponse.json(
    {
      fiveElementProfileId: profile.id,
      computedElement: profile.computedElement,
      balance: fiveElements.balance,
      integratedStone: {
        id: integratedStone.id,
        slug: integratedStone.slug,
        nameKo: integratedStone.nameKo,
        nameEn: integratedStone.nameEn,
        colorHex: integratedStone.colorHex,
        imageUrl: integratedStone.imageUrl,
      },
      heartSummary: profile.heartSummary,
      rationale: profile.rationale,
      comfortLines: profile.comfortLines,
      microAction: profile.microAction,
      usedFallback: profile.usedFallback,
    },
    { status: 201 },
  );
}
