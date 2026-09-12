import {
  CURRENT_RULESET_VERSION,
  REPEAT_PENALTY_MULTI_HIT,
  REPEAT_PENALTY_ONE_HIT,
  REPEAT_WINDOW,
  normalizeWeights,
} from "./weights";
import type {
  EngineFiveElement,
  EngineStone,
  EngineStoneTag,
  RecommendationEngineInput,
  RecommendationEngineResult,
  StoneCandidateScore,
} from "./types";

/** 오행 상생 관계: key가 생성하는(돕는) 대상 원소. */
const GENERATES: Record<EngineFiveElement, EngineFiveElement> = {
  WOOD: "FIRE",
  FIRE: "EARTH",
  EARTH: "METAL",
  METAL: "WATER",
  WATER: "WOOD",
};

function affinity(
  stoneId: string,
  tagId: string | undefined,
  stoneTags: EngineStoneTag[],
): number {
  if (!tagId) return 0;
  const match = stoneTags.find(
    (st) => st.stoneId === stoneId && st.tagId === tagId,
  );
  return match ? match.weight : 0;
}

/**
 * docs/08-recommendation-engine.md#오행-보완-친화도
 * 1.0: 원석 오행이 필요한 오행과 일치, 0.5: 원석 오행이 필요한 오행을 상생(생성), 그 외 0.
 */
function elementAffinity(
  stoneElement: EngineFiveElement | null | undefined,
  neededElement: EngineFiveElement,
): number {
  if (!stoneElement) return 0;
  if (stoneElement === neededElement) return 1;
  if (GENERATES[stoneElement] === neededElement) return 0.5;
  return 0;
}

function repeatPenalty(stoneId: string, recentStoneIds: string[]): number {
  const window = recentStoneIds.slice(0, REPEAT_WINDOW);
  const hits = window.filter((id) => id === stoneId).length;
  if (hits === 0) return 1;
  if (hits === 1) return REPEAT_PENALTY_ONE_HIT;
  return REPEAT_PENALTY_MULTI_HIT;
}

/**
 * 결정론적 규칙 기반 원석 추천. docs/08-recommendation-engine.md의 의사코드를 그대로 구현한다.
 * 난수를 사용하지 않으며, 동일 입력은 항상 동일한 stoneId를 반환한다.
 */
export function recommend(
  input: RecommendationEngineInput,
  stones: EngineStone[],
  stoneTags: EngineStoneTag[],
): RecommendationEngineResult {
  if (stones.length === 0) {
    throw new Error("추천할 원석이 없습니다 (원석 카탈로그가 비어 있음).");
  }
  if (input.context === "five-elements" && !input.fiveElement) {
    throw new Error(
      "five-elements 컨텍스트에는 fiveElement 신호가 필요합니다.",
    );
  }

  const hasSecondaryWish = Boolean(input.wish.secondaryWishTagId);
  const weights = normalizeWeights(input.context, hasSecondaryWish);

  const scored: StoneCandidateScore[] = stones.map((stone) => {
    const breakdown: Record<string, number> = {};
    let rawScore = 0;

    breakdown.primaryWish =
      weights.primaryWish *
      affinity(stone.id, input.wish.primaryWishTagId, stoneTags);
    rawScore += breakdown.primaryWish;

    if (hasSecondaryWish) {
      breakdown.secondaryWish =
        weights.secondaryWish *
        affinity(stone.id, input.wish.secondaryWishTagId, stoneTags);
      rawScore += breakdown.secondaryWish;
    }

    breakdown.heart =
      weights.heart * affinity(stone.id, input.wish.heartTagId, stoneTags);
    rawScore += breakdown.heart;

    if (input.fiveElement) {
      breakdown.fiveElement =
        weights.fiveElement *
        elementAffinity(stone.element, input.fiveElement.neededElement);
      rawScore += breakdown.fiveElement;
    }

    const penalty = repeatPenalty(stone.id, input.recentStoneIds);
    const finalScore = rawScore * penalty;

    return { stoneId: stone.id, rawScore, finalScore, breakdown };
  });

  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    const slugA = stones.find((s) => s.id === a.stoneId)!.slug;
    const slugB = stones.find((s) => s.id === b.stoneId)!.slug;
    return slugA.localeCompare(slugB);
  });

  const winner = scored[0];
  return {
    stoneId: winner.stoneId,
    rulesetVersion: CURRENT_RULESET_VERSION,
    finalScore: winner.finalScore,
    breakdown: winner.breakdown,
    candidates: scored.slice(0, 10),
  };
}
