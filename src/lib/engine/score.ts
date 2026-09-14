import { CURRENT_RULESET_VERSION, normalizeWeights } from "./weights";
import type {
  EngineFiveElement,
  EngineStone,
  EngineStoneTag,
  FiveElementSignal,
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

/**
 * 상대방의 필요 기운도 함께 제공된 경우(관계 원석에서 상대방 생년월일시를
 * 입력했거나, 초대 응답으로 나중에 확보된 경우) 두 사람의 친화도 평균을 쓴다.
 * docs/13-decisions-and-open-questions.md 참조.
 */
function combinedElementAffinity(
  stoneElement: EngineFiveElement | null | undefined,
  signal: FiveElementSignal,
): number {
  const mine = elementAffinity(stoneElement, signal.neededElement);
  if (!signal.partnerNeededElement) return mine;
  const partner = elementAffinity(stoneElement, signal.partnerNeededElement);
  return (mine + partner) / 2;
}

function requireFiveElementSignal(input: RecommendationEngineInput): void {
  if (!input.fiveElement) {
    throw new Error(`${input.context} 컨텍스트에는 fiveElement 신호가 필요합니다.`);
  }
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
  if (input.context === "five-elements" || input.context === "partner-five-elements") {
    requireFiveElementSignal(input);
  }
  if (input.context === "relationship" && !input.relationship) {
    throw new Error("relationship 컨텍스트에는 relationship 신호가 필요합니다.");
  }

  const hasSecondaryWish = Boolean(input.wish.secondaryWishTagId);
  const hasFiveElement = Boolean(input.fiveElement);
  const weights = normalizeWeights(input.context, {
    secondaryWish: hasSecondaryWish,
    fiveElement: hasFiveElement,
  });

  const scored: StoneCandidateScore[] = stones.map((stone) => {
    const breakdown: Record<string, number> = {};
    let score = 0;

    if (weights.primaryWish > 0) {
      breakdown.primaryWish =
        weights.primaryWish *
        affinity(stone.id, input.wish.primaryWishTagId, stoneTags);
      score += breakdown.primaryWish;
    }

    if (hasSecondaryWish) {
      breakdown.secondaryWish =
        weights.secondaryWish *
        affinity(stone.id, input.wish.secondaryWishTagId, stoneTags);
      score += breakdown.secondaryWish;
    }

    if (weights.heart > 0) {
      breakdown.heart =
        weights.heart * affinity(stone.id, input.wish.heartTagId, stoneTags);
      score += breakdown.heart;
    }

    if (input.fiveElement) {
      breakdown.fiveElement =
        weights.fiveElement *
        combinedElementAffinity(stone.element, input.fiveElement);
      score += breakdown.fiveElement;
    }

    if (input.relationship) {
      breakdown.relationshipGoal =
        weights.relationshipGoal *
        affinity(stone.id, input.relationship.relationshipGoalTagId, stoneTags);
      score += breakdown.relationshipGoal;
    }

    return { stoneId: stone.id, score, breakdown };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const slugA = stones.find((s) => s.id === a.stoneId)!.slug;
    const slugB = stones.find((s) => s.id === b.stoneId)!.slug;
    return slugA.localeCompare(slugB);
  });

  const winner = scored[0];
  return {
    stoneId: winner.stoneId,
    rulesetVersion: CURRENT_RULESET_VERSION,
    score: winner.score,
    breakdown: winner.breakdown,
    candidates: scored.slice(0, 10),
  };
}
