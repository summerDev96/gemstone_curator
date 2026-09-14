export type EngineContext =
  | "basic"
  | "five-elements"
  | "relationship"
  | "partner-five-elements";

export type EngineFiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";

export interface WishSignal {
  /** "partner-five-elements" 컨텍스트는 파트너 본인의 소원/감정 신호가 없어 생략 가능 */
  primaryWishTagId?: string;
  secondaryWishTagId?: string;
  heartTagId?: string;
}

export interface FiveElementSignal {
  neededElement: EngineFiveElement;
  /**
   * "five-elements"/"partner-five-elements" 컨텍스트(본인/상대방 각자의 원석)에서
   * 사용하는 보조 판별 신호. neededElement만으로는 같은 원소를 필요로 하는 원석이
   * 여럿일 때 항상 동일한 원석(알파벳순 1등)으로 몰리는 문제가 있어, 두 번째로
   * 필요한 원소도 약한 가중치로 함께 반영한다(docs/13 참조).
   */
  secondaryNeededElement?: EngineFiveElement;
  /**
   * "relationship" 컨텍스트에서 상대방도 생년월일시를 제공한 경우, 상대방의 필요
   * 기운도 함께 반영해 "우리의 원석"이 두 사람 모두를 고려하도록 한다(선택).
   */
  partnerNeededElement?: EngineFiveElement;
}

export interface RelationshipSignal {
  relationshipGoalTagId: string;
}

export interface RecommendationEngineInput {
  context: EngineContext;
  wish: WishSignal;
  /** context === "five-elements" | "relationship"(선택) | "partner-five-elements"일 때 사용 */
  fiveElement?: FiveElementSignal;
  /** context === "relationship"일 때 필수 */
  relationship?: RelationshipSignal;
}

export interface EngineStone {
  id: string;
  slug: string;
  element?: EngineFiveElement | null;
}

export interface EngineStoneTag {
  stoneId: string;
  tagId: string;
  weight: number;
}

export interface StoneCandidateScore {
  stoneId: string;
  score: number;
  breakdown: Record<string, number>;
}

export interface RecommendationEngineResult {
  stoneId: string;
  rulesetVersion: string;
  score: number;
  breakdown: Record<string, number>;
  candidates: StoneCandidateScore[];
}
