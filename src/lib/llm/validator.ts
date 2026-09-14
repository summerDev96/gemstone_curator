import {
  GeneratedRecommendationCopySchema,
  RelationshipCopySchema,
  type GeneratedRecommendationCopy,
  type RelationshipCopy,
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

export interface ValidateOptions {
  confirmedStoneNames: string[];
  otherStoneNames: string[];
}

function checkTextSafety(
  texts: string[],
  options: ValidateOptions,
): ValidationFailureReason | null {
  const allText = texts.join(" ");
  if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(allText))) {
    return "forbidden_phrase";
  }
  const mentionsOther = options.otherStoneNames
    .filter((name) => !options.confirmedStoneNames.includes(name))
    .some((name) => name.length >= 2 && allText.includes(name));
  if (mentionsOther) {
    return "stone_name_mismatch";
  }
  return null;
}

export interface ValidationResult {
  valid: boolean;
  reason?: ValidationFailureReason;
  data?: GeneratedRecommendationCopy;
}

export function validateGeneratedCopy(
  raw: unknown,
  options: ValidateOptions,
): ValidationResult {
  const parsed = GeneratedRecommendationCopySchema.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, reason: "schema_violation" };
  }

  const reason = checkTextSafety(
    [parsed.data.heartSummary, parsed.data.rationale, ...parsed.data.comfortLines, parsed.data.microAction],
    options,
  );
  if (reason) return { valid: false, reason };

  return { valid: true, data: parsed.data };
}

export interface RelationshipValidationResult {
  valid: boolean;
  reason?: ValidationFailureReason;
  data?: RelationshipCopy;
}

export function validateRelationshipCopy(
  raw: unknown,
  options: ValidateOptions,
): RelationshipValidationResult {
  const parsed = RelationshipCopySchema.safeParse(raw);
  if (!parsed.success) {
    return { valid: false, reason: "schema_violation" };
  }

  const reason = checkTextSafety(
    [parsed.data.conversationPrompt, parsed.data.microAction],
    options,
  );
  if (reason) return { valid: false, reason };

  return { valid: true, data: parsed.data };
}
