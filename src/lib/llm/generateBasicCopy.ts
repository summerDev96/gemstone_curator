import { getFallbackCopy } from "./fallback";
import { BASIC_SYSTEM_PROMPT, buildBasicUserPrompt, type BasicPromptInput } from "./prompts/basic";
import type { LLMProvider } from "./provider";
import { GENERATED_RECOMMENDATION_COPY_JSON_SCHEMA } from "./schema";
import type { GeneratedRecommendationCopy } from "./schema";
import { validateGeneratedCopy } from "./validator";

export const BASIC_PROMPT_VERSION = "2026.09.0";

export interface GenerateBasicCopyInput extends BasicPromptInput {
  stoneSlug: string;
  otherStoneNames: string[];
}

export interface GenerateBasicCopyResult {
  copy: GeneratedRecommendationCopy;
  usedFallback: boolean;
  modelName: string;
  promptVersion: string;
}

async function attemptGenerate(
  input: GenerateBasicCopyInput,
  llm: LLMProvider,
): Promise<{ copy: GeneratedRecommendationCopy; modelName: string } | null> {
  try {
    const result = await llm.generateStructured<unknown>({
      systemPrompt: BASIC_SYSTEM_PROMPT,
      userPrompt: buildBasicUserPrompt(input),
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

/**
 * docs/09-ai-prompts-and-safety.md#timeout-및-retry
 * 1회 재시도 후에도 실패하면 검수된 fallback 문장으로 전환한다.
 */
export async function generateBasicCopy(
  input: GenerateBasicCopyInput,
  llm: LLMProvider,
): Promise<GenerateBasicCopyResult> {
  const first = await attemptGenerate(input, llm);
  if (first) {
    return {
      copy: first.copy,
      usedFallback: false,
      modelName: first.modelName,
      promptVersion: BASIC_PROMPT_VERSION,
    };
  }

  const retry = await attemptGenerate(input, llm);
  if (retry) {
    return {
      copy: retry.copy,
      usedFallback: false,
      modelName: retry.modelName,
      promptVersion: BASIC_PROMPT_VERSION,
    };
  }

  return {
    copy: getFallbackCopy(input.stoneSlug),
    usedFallback: true,
    modelName: "fallback",
    promptVersion: BASIC_PROMPT_VERSION,
  };
}
