import type { LLMProvider } from "../llm/provider";
import {
  SAFETY_CLASSIFICATION_JSON_SCHEMA,
  SAFETY_SYSTEM_PROMPT,
  buildSafetyUserPrompt,
} from "../llm/prompts/safety";
import { detectCrisisKeywords, type CrisisCategory } from "./keywordDetector";

export interface SafetyClassification {
  isCrisis: boolean;
  category: CrisisCategory;
}

interface LLMSafetyOutput {
  isCrisis: boolean;
  category: CrisisCategory;
  confidence: number;
}

/**
 * 키워드 감지 + LLM 분류 이중 안전망. 둘 중 하나라도 위기로 판단하면 위기로 라우팅한다.
 * LLM 분류가 실패(예외)하면 보수적으로 위기로 간주한다 (fail-safe).
 * docs/09-ai-prompts-and-safety.md#안전-분류-프롬프트
 */
export async function classifyInput(
  freeText: string,
  llm: LLMProvider,
): Promise<SafetyClassification> {
  const keywordResult = detectCrisisKeywords(freeText);
  if (keywordResult.isCrisis) {
    return keywordResult;
  }

  try {
    const result = await llm.generateStructured<LLMSafetyOutput>({
      systemPrompt: SAFETY_SYSTEM_PROMPT,
      userPrompt: buildSafetyUserPrompt(freeText),
      jsonSchema: SAFETY_CLASSIFICATION_JSON_SCHEMA,
      schemaName: "safety_classification",
      timeoutMs: 6000,
      maxOutputTokens: 200,
    });
    return { isCrisis: result.data.isCrisis, category: result.data.category };
  } catch {
    return { isCrisis: true, category: "none" };
  }
}
