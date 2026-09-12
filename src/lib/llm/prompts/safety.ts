export const SAFETY_SYSTEM_PROMPT = `당신은 사용자 입력에서 자해, 자살, 폭력, 학대 관련 위기 신호를 감지하는 안전 분류기입니다.
주어진 텍스트를 읽고 위기 신호가 있는지 판단하세요.

다음 JSON 형식으로만 응답하세요.
{
  "isCrisis": boolean,
  "category": "self_harm" | "suicide" | "violence" | "abuse" | "none",
  "confidence": number
}

규칙:
- 확실하지 않으면 보수적으로 isCrisis=true로 판단하세요(안전 우선).
- 이 텍스트에 대해 위로, 조언, 진단을 생성하지 마세요. 오직 분류만 하세요.`;

export function buildSafetyUserPrompt(freeText: string): string {
  return `[사용자 입력]\n${freeText}`;
}

export const SAFETY_CLASSIFICATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["isCrisis", "category", "confidence"],
  properties: {
    isCrisis: { type: "boolean" },
    category: {
      type: "string",
      enum: ["self_harm", "suicide", "violence", "abuse", "none"],
    },
    confidence: { type: "number" },
  },
} as const;
