import type { EngineContext } from "./types";

/**
 * docs/08-recommendation-engine.md 초기 가중치 표.
 * 모든 값은 초기 휴리스틱이며 추가 검증 필요.
 */
export const CURRENT_RULESET_VERSION = "2026.09.2";

export interface ContextWeights {
  primaryWish: number;
  secondaryWish: number;
  heart: number;
  fiveElement: number;
  relationshipGoal: number;
}

const ZERO: ContextWeights = {
  primaryWish: 0,
  secondaryWish: 0,
  heart: 0,
  fiveElement: 0,
  relationshipGoal: 0,
};

const WEIGHT_TABLE: Record<EngineContext, ContextWeights> = {
  basic: { ...ZERO, primaryWish: 0.5, secondaryWish: 0.15, heart: 0.35 },
  // "나의 원석"(개인 오행 진단)은 소원/감정과 섞으면 같은 생년월일이라도 그날 고른
  // 소원/감정에 따라 결과가 달라져 "사주 기반 진단"으로서의 안정성이 떨어진다는
  // 문제가 있었다. 오행 친화도만으로 정하도록 바꿨다(아래 partner-five-elements와
  // 동일, docs/13 참조). 소원/감정은 여전히 결과 화면의 LLM 카피 맥락으로만 쓰인다.
  "five-elements": { ...ZERO, fiveElement: 1 },
  // docs/08 원안은 relationshipType(0.10)도 별도 신호로 뒀으나, 원석과 관계 유형을
  // 잇는 근거 있는 매핑을 정의할 수 없어 제외했다(대신 LLM 카피의 맥락으로만 사용).
  // 제외된 0.10은 나머지 신호에 비례 배분해 반영했다(docs/13 추가 검증 필요).
  relationship: {
    ...ZERO,
    primaryWish: 0.2,
    secondaryWish: 0.05,
    heart: 0.15,
    fiveElement: 0.25,
    relationshipGoal: 0.35,
  },
  // 파트너는 본인의 소원/감정을 입력하지 않으므로 오행 친화도만으로 판단한다.
  "partner-five-elements": { ...ZERO, fiveElement: 1 },
};

export interface PresentSignals {
  secondaryWish: boolean;
  fiveElement: boolean;
}

/**
 * 선택적 신호(보조 소원, 오행 보완)가 없을 경우 가중치를 나머지 존재하는 신호에
 * 비례 배분한다. docs/08-recommendation-engine.md#누락-신호-재정규화
 */
export function normalizeWeights(
  context: EngineContext,
  present: PresentSignals,
): ContextWeights {
  const base = WEIGHT_TABLE[context];

  const missing =
    (present.secondaryWish ? 0 : base.secondaryWish) +
    (present.fiveElement ? 0 : base.fiveElement);
  if (missing === 0) return { ...base };

  const presentSum =
    base.primaryWish +
    base.heart +
    base.relationshipGoal +
    (present.secondaryWish ? base.secondaryWish : 0) +
    (present.fiveElement ? base.fiveElement : 0);

  if (presentSum === 0) return { ...base };

  const scale = (w: number) => w + missing * (w / presentSum);

  return {
    primaryWish: scale(base.primaryWish),
    secondaryWish: present.secondaryWish ? scale(base.secondaryWish) : 0,
    heart: scale(base.heart),
    fiveElement: present.fiveElement ? scale(base.fiveElement) : 0,
    relationshipGoal: scale(base.relationshipGoal),
  };
}
