import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { getClientIp } from "@/lib/clientIp";
import { prisma } from "@/lib/db";
import { recommend } from "@/lib/engine";
import { generateBasicCopy } from "@/lib/llm/generateBasicCopy";
import { getLLMProvider } from "@/lib/llm/getProvider";
import { checkRateLimit } from "@/lib/rateLimit";
import { classifyInput } from "@/lib/safety/classifyInput";
import { resolveSession } from "@/lib/session";
import { RecommendationBasicRequestSchema } from "@/lib/validation/recommendations";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

export async function POST(request: Request) {
  const llm = getLLMProvider();
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(`recommendations-basic:${session.id}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }
  const ipRateLimit = checkRateLimit(
    `recommendations-basic-ip:${getClientIp(request)}`,
    20,
    60_000,
  );
  if (!ipRateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "요청 본문이 유효한 JSON이 아닙니다.");
  }

  const parsed = RecommendationBasicRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }
  const body = parsed.data;

  if (body.freeText && body.freeText.trim().length > 0) {
    const classification = await classifyInput(body.freeText, llm);
    if (classification.isCrisis) {
      return apiError(
        "SAFETY_BLOCKED",
        "지금 겪고 계신 어려움에 대해 전문적인 도움을 받아보시길 권해드려요.",
      );
    }
  }

  const [primaryWishTag, secondaryWishTag, heartTag] = await Promise.all([
    prisma.tag.findUnique({ where: { id: body.primaryWishTagId } }),
    body.secondaryWishTagId
      ? prisma.tag.findUnique({ where: { id: body.secondaryWishTagId } })
      : Promise.resolve(null),
    prisma.tag.findUnique({ where: { id: body.heartTagId } }),
  ]);

  if (!primaryWishTag || !heartTag) {
    return apiError("NOT_FOUND", "존재하지 않는 태그입니다.");
  }
  if (body.secondaryWishTagId && !secondaryWishTag) {
    return apiError("NOT_FOUND", "존재하지 않는 태그입니다.");
  }

  const [stones, stoneTags] = await Promise.all([
    prisma.stone.findMany({ where: { isActive: true } }),
    prisma.stoneTag.findMany(),
  ]);

  const engineResult = recommend(
    {
      context: "basic",
      wish: {
        primaryWishTagId: body.primaryWishTagId,
        secondaryWishTagId: body.secondaryWishTagId,
        heartTagId: body.heartTagId,
      },
    },
    stones.map((s) => ({ id: s.id, slug: s.slug })),
    stoneTags.map((st) => ({
      stoneId: st.stoneId,
      tagId: st.tagId,
      weight: st.weight,
    })),
  );

  const stone = stones.find((s) => s.id === engineResult.stoneId)!;
  const otherStoneNames = stones
    .filter((s) => s.id !== stone.id)
    .flatMap((s) => [s.nameKo, s.nameEn]);

  const generated = await generateBasicCopy(
    {
      stoneSlug: stone.slug,
      stoneNameKo: stone.nameKo,
      stoneNameEn: stone.nameEn,
      stoneSummary: stone.summary,
      stoneDescription: stone.description,
      primaryWishLabel: primaryWishTag.labelKo,
      secondaryWishLabel: secondaryWishTag?.labelKo,
      heartLabel: heartTag.labelKo,
      freeText: body.freeText,
      otherStoneNames,
    },
    llm,
  );

  const wishSession = await prisma.wishSession.create({
    data: {
      anonymousSessionId: session.id,
      primaryWishTagId: body.primaryWishTagId,
      secondaryWishTagId: body.secondaryWishTagId,
      heartTagId: body.heartTagId,
      freeTextProvided: Boolean(body.freeText && body.freeText.trim()),
    },
  });

  const recommendation = await prisma.recommendation.create({
    data: {
      wishSessionId: wishSession.id,
      stoneId: stone.id,
      rulesetVersion: engineResult.rulesetVersion,
      score: engineResult.score,
      heartSummary: generated.copy.heartSummary,
      rationale: generated.copy.rationale,
      comfortLines: generated.copy.comfortLines,
      microAction: generated.copy.microAction,
      usedFallback: generated.usedFallback,
      promptVersion: generated.promptVersion,
      modelName: generated.modelName,
      generatedAt: new Date(),
    },
    include: { stone: true },
  });

  return NextResponse.json(
    {
      id: recommendation.id,
      stone: {
        id: recommendation.stone.id,
        slug: recommendation.stone.slug,
        nameKo: recommendation.stone.nameKo,
        nameEn: recommendation.stone.nameEn,
        colorHex: recommendation.stone.colorHex,
        imageUrl: recommendation.stone.imageUrl,
      },
      heartSummary: recommendation.heartSummary,
      rationale: recommendation.rationale,
      comfortLines: recommendation.comfortLines,
      microAction: recommendation.microAction,
      usedFallback: recommendation.usedFallback,
      createdAt: recommendation.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
