import {
  GeneratedRecommendationCopySchema,
  type GeneratedRecommendationCopy,
} from "./schema";

/**
 * docs/09-ai-prompts-and-safety.md#금지-표현-목록
 * 정규식 1차 필터링. 위반 시 fallback으로 전환한다.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /반드시\s*.{0,10}(됩니다|입니다|합니다)/,
  /할\s?운명/,
  /가?\s?확실합니다/,
  /치료/,
  /진단/,
  /질환/,
  /증상\s?완화/,
  /처방/,
  /합격합니다/,
  /성공할\s?거예요/,
  /재물이\s?들어옵니다/,
  /천생연분/,
  /결혼해야\s?합니다/,
  /헤어지세요/,
  /지금\s?사지\s?않으면/,
  /불운이\s?옵니다/,
];

export type ValidationFailureReason =
  | "forbidden_phrase"
  | "schema_violation"
  | "stone_name_mismatch";

export interface ValidationResult {
  valid: boolean;
  reason?: ValidationFailureReason;
  data?: GeneratedRecommendationCopy;
}

function containsForbiddenPhrase(copy: GeneratedRecommendationCopy): boolean {
  const allText = [
    copy.heartSummary,
    copy.rationale,
    ...copy.comfortLines,
    copy.microAction,
  ].join(" ");
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(allText));
}

function mentionsOtherStoneName(
  copy: GeneratedRecommendationCopy,
  confirmedStoneNames: string[],
  otherStoneNames: string[],
): boolean {
  const allText = [
    copy.heartSummary,
    copy.rationale,
    ...copy.comfortLines,
    copy.microAction,
  ].join(" ");
  return otherStoneNames
    .filter((name) => !confirmedStoneNames.includes(name))
    .some((name) => name.length >= 2 && allText.includes(name));
}

export interface ValidateOptions {
  confirmedStoneNames: string[];
  otherStoneNames: string[];
}

export function validateGeneratedCopy(
  raw: unknown,
  options: ValidateOptions,
): ValidationResult {
  const parsed = GeneratedRecommendationCopySchema.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, reason: "schema_violation" };
  }

  if (containsForbiddenPhrase(parsed.data)) {
    return { valid: false, reason: "forbidden_phrase" };
  }

  if (
    mentionsOtherStoneName(
      parsed.data,
      options.confirmedStoneNames,
      options.otherStoneNames,
    )
  ) {
    return { valid: false, reason: "stone_name_mismatch" };
  }

  return { valid: true, data: parsed.data };
}
