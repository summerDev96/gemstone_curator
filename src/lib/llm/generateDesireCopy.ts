import { getFallbackCopy } from "./fallback";
import {
  DESIRE_SYSTEM_PROMPT,
  buildDesireUserPrompt,
  type DesirePromptInput,
} from "./prompts/desire";
import type { LLMProvider } from "./provider";
import { GENERATED_RECOMMENDATION_COPY_JSON_SCHEMA } from "./schema";
import type { GeneratedRecommendationCopy } from "./schema";
import { validateGeneratedCopy } from "./validator";

export const DESIRE_PROMPT_VERSION = "2026.09.0";

export interface GenerateDesireCopyInput extends DesirePromptInput {
  stoneSlug: string;
  otherStoneNames: string[];
}

export interface GenerateDesireCopyResult {
  copy: GeneratedRecommendationCopy;
  usedFallback: boolean;
  modelName: string;
  promptVersion: string;
}

async function attemptGenerate(
  input: GenerateDesireCopyInput,
  llm: LLMProvider,
): Promise<{ copy: GeneratedRecommendationCopy; modelName: string } | null> {
  try {
    const result = await llm.generateStructured<unknown>({
      systemPrompt: DESIRE_SYSTEM_PROMPT,
      userPrompt: buildDesireUserPrompt(input),
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
export async function generateDesireCopy(
  input: GenerateDesireCopyInput,
  llm: LLMProvider,
): Promise<GenerateDesireCopyResult> {
  const first = await attemptGenerate(input, llm);
  if (first) {
    return {
      copy: first.copy,
      usedFallback: false,
      modelName: first.modelName,
      promptVersion: DESIRE_PROMPT_VERSION,
    };
  }

  const retry = await attemptGenerate(input, llm);
  if (retry) {
    return {
      copy: retry.copy,
      usedFallback: false,
      modelName: retry.modelName,
      promptVersion: DESIRE_PROMPT_VERSION,
    };
  }

  return {
    copy: getFallbackCopy(input.stoneSlug),
    usedFallback: true,
    modelName: "fallback",
    promptVersion: DESIRE_PROMPT_VERSION,
  };
}
