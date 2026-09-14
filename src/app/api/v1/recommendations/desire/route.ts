import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiError";
import { prisma } from "@/lib/db";
import { stonesForDesire, USER_DESIRE_LABEL } from "@/lib/desire/mapping";
import { generateDesireCopy } from "@/lib/llm/generateDesireCopy";
import { getLLMProvider } from "@/lib/llm/getProvider";
import { checkRateLimit } from "@/lib/rateLimit";
import { resolveSession } from "@/lib/session";
import { DesireRequestSchema } from "@/lib/validation/desire";
import { zodToFieldErrors } from "@/lib/validation/zodToFieldErrors";

/**
 * "내 염원으로 추천받기" — 생년월일(사주)을 받지 않고, 사용자가 고른 염원만으로
 * 원석을 찾는다. 오행 분석/기본 추천과 달리 결정론적 점수 엔진을 쓰지 않고,
 * 사람이 미리 정리한 오행×목적 매핑 표(`DESIRE_GROUP_STONE_SLUGS`)를 그대로
 * 조회한다 — 매핑에 없는 조합은 빈 배열을 반환하며 임의로 대체하지 않는다.
 * 매핑 표 순서상 가장 앞선 원석을 "가장 어울리는 원석"으로 보고 오행 분석과
 * 동일한 방식(LLM 마음 요약/위로 문구)으로 카피를 생성하며, 나머지는 카피 없이
 * 목록으로만 보여준다.
 */
export async function POST(request: Request) {
  const llm = getLLMProvider();
  const session = await resolveSession(request);
  if (!session) {
    return apiError("UNAUTHORIZED", "세션이 유효하지 않습니다.");
  }

  const rateLimit = checkRateLimit(`recommendations-desire:${session.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    return apiError("RATE_LIMITED", "잠시 후 다시 시도해주세요.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "요청 본문이 유효한 JSON이 아닙니다.");
  }

  const parsed = DesireRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "입력값을 확인해주세요.",
      zodToFieldErrors(parsed.error),
    );
  }
  const desire = parsed.data.desire;

  const slugs = stonesForDesire(desire);
  const [matchedStones, allStones] = await Promise.all([
    prisma.stone.findMany({ where: { slug: { in: slugs }, isActive: true } }),
    prisma.stone.findMany({ where: { isActive: true } }),
  ]);
  const bySlug = new Map(matchedStones.map((s) => [s.slug, s]));
  const ordered = slugs.map((slug) => bySlug.get(slug)).filter((s) => s != null);

  if (ordered.length === 0) {
    return NextResponse.json({ topStone: null, otherStones: [] });
  }

  const [topStone, ...otherStones] = ordered;
  const otherStoneNames = allStones
    .filter((s) => s.id !== topStone.id)
    .flatMap((s) => [s.nameKo, s.nameEn]);

  const generated = await generateDesireCopy(
    {
      stoneSlug: topStone.slug,
      stoneNameKo: topStone.nameKo,
      stoneNameEn: topStone.nameEn,
      stoneSummary: topStone.summary,
      stoneDescription: topStone.description,
      desireLabel: USER_DESIRE_LABEL[desire],
      otherStoneNames,
    },
    llm,
  );

  return NextResponse.json({
    topStone: {
      id: topStone.id,
      slug: topStone.slug,
      nameKo: topStone.nameKo,
      nameEn: topStone.nameEn,
      colorHex: topStone.colorHex,
      imageUrl: topStone.imageUrl,
      heartSummary: generated.copy.heartSummary,
      rationale: generated.copy.rationale,
      comfortLines: generated.copy.comfortLines,
      microAction: generated.copy.microAction,
      usedFallback: generated.usedFallback,
    },
    otherStones: otherStones.map((s) => ({
      id: s.id,
      slug: s.slug,
      nameKo: s.nameKo,
      nameEn: s.nameEn,
      colorHex: s.colorHex,
      imageUrl: s.imageUrl,
      summary: s.summary,
    })),
  });
}
