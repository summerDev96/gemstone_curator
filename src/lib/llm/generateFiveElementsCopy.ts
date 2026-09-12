import { getFallbackCopy } from "./fallback";
import {
  FIVE_ELEMENTS_SYSTEM_PROMPT,
  buildFiveElementsUserPrompt,
  type FiveElementsPromptInput,
} from "./prompts/fiveElements";
import type { LLMProvider } from "./provider";
import { GENERATED_RECOMMENDATION_COPY_JSON_SCHEMA } from "./schema";
import type { GeneratedRecommendationCopy } from "./schema";
import { validateGeneratedCopy } from "./validator";

export const FIVE_ELEMENTS_PROMPT_VERSION = "2026.09.0";

export interface GenerateFiveElementsCopyInput extends FiveElementsPromptInput {
  stoneSlug: string;
  otherStoneNames: string[];
}

export interface GenerateFiveElementsCopyResult {
  copy: GeneratedRecommendationCopy;
  usedFallback: boolean;
  modelName: string;
  promptVersion: string;
}

async function attemptGenerate(
  input: GenerateFiveElementsCopyInput,
  llm: LLMProvider,
): Promise<{ copy: GeneratedRecommendationCopy; modelName: string } | null> {
  try {
    const result = await llm.generateStructured<unknown>({
      systemPrompt: FIVE_ELEMENTS_SYSTEM_PROMPT,
      userPrompt: buildFiveElementsUserPrompt(input),
      jsonSchema: GENERATED_RECOMMENDATION_COPY_JSON_SCHEMA,
      schemaName: "generated_recommendation_copy",
      timeoutMs: 6000,
      maxOutputTokens: 600,
    });

    const validation = validateGeneratedCopy(result.data, {
      confirmedStoneNames: [input.stoneNameKo, input.stoneNameEn],
      otherStoneNames: input.otherStoneNames,
    });

    if (!validation.valid || !validation.data) return null;
    return { copy: validation.data, modelName: result.modelName };
  } catch {
    return null;
  }
}

/** docs/09-ai-prompts-and-safety.md#timeout-및-retry — 1회 재시도 후 fallback 전환. */
export async function generateFiveElementsCopy(
  input: GenerateFiveElementsCopyInput,
  llm: LLMProvider,
): Promise<GenerateFiveElementsCopyResult> {
  const first = await attemptGenerate(input, llm);
  if (first) {
    return {
      copy: first.copy,
      usedFallback: false,
      modelName: first.modelName,
      promptVersion: FIVE_ELEMENTS_PROMPT_VERSION,
    };
  }

  const retry = await attemptGenerate(input, llm);
  if (retry) {
    return {
      copy: retry.copy,
      usedFallback: false,
      modelName: retry.modelName,
      promptVersion: FIVE_ELEMENTS_PROMPT_VERSION,
    };
  }

  return {
    copy: getFallbackCopy(input.stoneSlug),
    usedFallback: true,
    modelName: "fallback",
    promptVersion: FIVE_ELEMENTS_PROMPT_VERSION,
  };
}
