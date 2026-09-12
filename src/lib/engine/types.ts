export type EngineContext = "basic" | "five-elements";

export type EngineFiveElement = "WOOD" | "FIRE" | "EARTH" | "METAL" | "WATER";

export interface WishSignal {
  primaryWishTagId: string;
  secondaryWishTagId?: string;
  heartTagId: string;
}

export interface FiveElementSignal {
  neededElement: EngineFiveElement;
}

export interface RecommendationEngineInput {
  context: EngineContext;
  wish: WishSignal;
  /** context === "five-elements"일 때 필수 */
  fiveElement?: FiveElementSignal;
  recentStoneIds: string[];
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
  rawScore: number;
  finalScore: number;
  breakdown: Record<string, number>;
}

export interface RecommendationEngineResult {
  stoneId: string;
  rulesetVersion: string;
  finalScore: number;
  breakdown: Record<string, number>;
  candidates: StoneCandidateScore[];
}
