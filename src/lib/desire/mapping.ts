export type UserDesire =
  | "love"
  | "romance"
  | "health"
  | "vitality"
  | "study"
  | "healing"
  | "relationships"
  | "protection"
  | "defense";

export const USER_DESIRE_LABEL: Record<UserDesire, string> = {
  love: "사랑",
  romance: "연애",
  health: "건강",
  vitality: "활력",
  study: "학업",
  healing: "힐링",
  relationships: "대인관계",
  protection: "수호",
  defense: "방어",
};

type PurposeGroup =
  | "love_romance"
  | "health_vitality"
  | "study"
  | "healing_relationships"
  | "protection_defense";

export const PURPOSE_GROUP_MAP: Record<UserDesire, PurposeGroup> = {
  love: "love_romance",
  romance: "love_romance",
  health: "health_vitality",
  vitality: "health_vitality",
  study: "study",
  healing: "healing_relationships",
  relationships: "healing_relationships",
  protection: "protection_defense",
  defense: "protection_defense",
};

/**
 * 목적 그룹별 추천 원석 slug 목록. 사용자가 제공한 오행×목적 매핑 표(목/화/토/금/수
 * 5개 원소 칸)를 이 서비스가 실제로 보유한 23종 원석 카탈로그(`prisma/seed-data/stones.json`)와
 * 대조해, 카탈로그에 존재하는 원석만 남기고 만들었다.
 *
 * "내 염원으로 추천받기"는 생년월일(사주)을 입력받지 않는 흐름이라 어떤 오행 칸을
 * 써야 할지 판단할 근거가 없다 — 그래서 목적 그룹 하나에 딸린 목/화/토/금/수 5칸의
 * 원석을 모두 합친(union) 목록을 후보로 쓴다(사용자 확인, docs/13 참조).
 *
 * 매핑 표에 있었지만 카탈로그에 없는 원석(예: 말라카이트, 문스톤, 호안석류, 침수정류,
 * 옵시디언 등 약 20여 종)은 임의로 대체하거나 새로 추가하지 않고 그냥 제외했다
 * (근거 없이 원석을 새로 만들지 않는다는 원칙, 사용자 확인).
 *
 * 순서는 매핑 표에 원석이 등장한 순서(목→화→토→금→수)를 그대로 따른다.
 */
export const DESIRE_GROUP_STONE_SLUGS: Record<PurposeGroup, string[]> = {
  love_romance: ["turquoise", "amazonite", "lapis-lazuli", "sapphire", "garnet", "jade"],
  health_vitality: ["jade", "amazonite", "garnet"],
  study: ["lapis-lazuli"],
  healing_relationships: ["lapis-lazuli", "amazonite", "garnet", "pearl"],
  protection_defense: ["turquoise", "amazonite", "pearl", "onyx"],
};

export function stonesForDesire(desire: UserDesire): string[] {
  const group = PURPOSE_GROUP_MAP[desire];
  return DESIRE_GROUP_STONE_SLUGS[group];
}
