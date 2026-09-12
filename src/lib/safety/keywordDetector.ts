/**
 * 위기 표현 감지를 위한 규칙 기반 키워드 목록 초안입니다.
 * docs/13-decisions-and-open-questions.md의 "위기 분류의 한국어 정확도" 항목에 따라
 * 임상심리 자문 등 전문가 검수가 필요한 미검수 콘텐츠입니다.
 */
export type CrisisCategory = "self_harm" | "suicide" | "violence" | "abuse" | "none";

interface KeywordRule {
  category: CrisisCategory;
  patterns: RegExp[];
}

const RULES: KeywordRule[] = [
  {
    category: "suicide",
    patterns: [
      /죽고\s?싶/,
      /자살/,
      /사라지고\s?싶/,
      /삶을\s?끝내/,
      /목숨을\s?끊/,
      /죽어버리고\s?싶/,
    ],
  },
  {
    category: "self_harm",
    patterns: [/자해/, /(스스로|나\s?자신을?|내\s?몸을?)\s?(해치|상처)/],
  },
  {
    category: "violence",
    patterns: [/죽여버리고\s?싶/, /때리고\s?싶/, /폭력을\s?쓰고\s?싶/],
  },
  {
    category: "abuse",
    patterns: [/학대(를|를당|받고)?/, /맞고\s?있어/],
  },
];

export interface KeywordDetectionResult {
  isCrisis: boolean;
  category: CrisisCategory;
}

export function detectCrisisKeywords(text: string): KeywordDetectionResult {
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { isCrisis: true, category: rule.category };
    }
  }
  return { isCrisis: false, category: "none" };
}
