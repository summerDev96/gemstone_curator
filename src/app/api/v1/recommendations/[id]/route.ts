import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const { id } = await context.params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: {
      stone: true,
      wishSession: true,
      fiveElementProfile: { include: { integratedStone: true } },
      relationshipAnalyses: {
        include: { myStone: true, partnerStone: true, weStone: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (
    !recommendation ||
    recommendation.wishSession.anonymousSessionId !== session.id
  ) {
    return apiError("NOT_FOUND", "결과를 찾을 수 없습니다.");
  }

  const fiveElements = recommendation.fiveElementProfile
    ? {
        fiveElementProfileId: recommendation.fiveElementProfile.id,
        computedElement: recommendation.fiveElementProfile.computedElement,
        balance: recommendation.fiveElementProfile.balanceJson,
        integratedStone: recommendation.fiveElementProfile.integratedStone && {
          id: recommendation.fiveElementProfile.integratedStone.id,
          slug: recommendation.fiveElementProfile.integratedStone.slug,
          nameKo: recommendation.fiveElementProfile.integratedStone.nameKo,
          nameEn: recommendation.fiveElementProfile.integratedStone.nameEn,
          colorHex: recommendation.fiveElementProfile.integratedStone.colorHex,
          imageUrl: recommendation.fiveElementProfile.integratedStone.imageUrl,
        },
        heartSummary: recommendation.fiveElementProfile.heartSummary,
        rationale: recommendation.fiveElementProfile.rationale,
        comfortLines: recommendation.fiveElementProfile.comfortLines,
        microAction: recommendation.fiveElementProfile.microAction,
        usedFallback: recommendation.fiveElementProfile.usedFallback,
      }
    : null;

  const relationships = recommendation.relationshipAnalyses.map((r) => ({
    relationshipAnalysisId: r.id,
    status: r.partnerStoneId ? "COMPLETED" : "PENDING_PARTNER",
    myStone: { id: r.myStone.id, nameKo: r.myStone.nameKo, nameEn: r.myStone.nameEn, colorHex: r.myStone.colorHex, imageUrl: r.myStone.imageUrl },
    partnerStone: r.partnerStone
      ? { id: r.partnerStone.id, nameKo: r.partnerStone.nameKo, nameEn: r.partnerStone.nameEn, colorHex: r.partnerStone.colorHex, imageUrl: r.partnerStone.imageUrl }
      : null,
    weStone: { id: r.weStone.id, nameKo: r.weStone.nameKo, nameEn: r.weStone.nameEn, colorHex: r.weStone.colorHex, imageUrl: r.weStone.imageUrl },
    conversationPrompt: r.conversationPrompt,
    microAction: r.microAction,
    usedFallback: r.usedFallback,
  }));

  return NextResponse.json({
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
    fiveElements,
    relationships,
  });
}
