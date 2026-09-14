import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { createFiveElementProfileForRecommendation } from "@/lib/fiveElements/createProfile";
import { getLLMProvider } from "@/lib/llm/getProvider";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveSession } from "@/lib/session";
import { FiveElementsRequestSchema } from "@/lib/validation/fiveElements";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

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

  const [stones, stoneTags] = await Promise.all([
    prisma.stone.findMany({ where: { isActive: true } }),
    prisma.stoneTag.findMany(),
  ]);

  const { profile, integratedStone } = await createFiveElementProfileForRecommendation({
    recommendationId: recommendation.id,
    wishSession: recommendation.wishSession,
    anonymousSessionId: session.id,
    birthInfo: body,
    consentVersion: body.consentVersion,
    stones,
    stoneTags: stoneTags.map((st) => ({
      stoneId: st.stoneId,
      tagId: st.tagId,
      weight: st.weight,
    })),
    llm,
  });

  return NextResponse.json(
    {
      fiveElementProfileId: profile.id,
      computedElement: profile.computedElement,
      balance: profile.balanceJson,
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
