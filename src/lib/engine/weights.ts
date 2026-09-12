import type { EngineContext } from "./types";

/**
 * docs/08-recommendation-engine.md 초기 가중치 표.
 * 모든 값은 초기 휴리스틱이며 추가 검증 필요.
 */
export const CURRENT_RULESET_VERSION = "2026.09.1";

interface ContextWeights {
  primaryWish: number;
  secondaryWish: number;
  heart: number;
  fiveElement: number;
}

const WEIGHT_TABLE: Record<EngineContext, ContextWeights> = {
  basic: { primaryWish: 0.5, secondaryWish: 0.15, heart: 0.35, fiveElement: 0 },
  "five-elements": {
    primaryWish: 0.35,
    secondaryWish: 0.1,
    heart: 0.2,
    fiveElement: 0.35,
  },
};

export const REPEAT_WINDOW = 3;
export const REPEAT_PENALTY_ONE_HIT = 0.85;
export const REPEAT_PENALTY_MULTI_HIT = 0.7;

/**
 * 보조 소원이 없을 경우 가중치를 나머지 신호에 비례 배분한다.
 * docs/08-recommendation-engine.md#누락-신호-재정규화
 */
export function normalizeWeights(
  context: EngineContext,
  hasSecondaryWish: boolean,
): ContextWeights {
  const base = WEIGHT_TABLE[context];
  if (hasSecondaryWish) {
    return { ...base };
  }

  const missing = base.secondaryWish;
  const presentSum = base.primaryWish + base.heart + base.fiveElement;

  return {
    primaryWish: base.primaryWish + missing * (base.primaryWish / presentSum),
    secondaryWish: 0,
    heart: base.heart + missing * (base.heart / presentSum),
    fiveElement:
      base.fiveElement > 0
        ? base.fiveElement + missing * (base.fiveElement / presentSum)
        : 0,
  };
}
