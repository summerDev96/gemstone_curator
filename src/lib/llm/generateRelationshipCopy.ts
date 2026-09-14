import { getRelationshipFallbackCopy } from "./relationshipFallback";
import {
  RELATIONSHIP_SYSTEM_PROMPT,
  buildRelationshipUserPrompt,
  type RelationshipPromptInput,
} from "./prompts/relationship";
import type { LLMProvider } from "./provider";
import { RELATIONSHIP_COPY_JSON_SCHEMA } from "./schema";
import type { RelationshipCopy } from "./schema";
import { validateRelationshipCopy } from "./validator";

export const RELATIONSHIP_PROMPT_VERSION = "2026.09.0";

export interface GenerateRelationshipCopyInput extends RelationshipPromptInput {
  /** fallback 조회 키. 우리의 원석(weStone) slug를 사용한다. */
  weStoneSlug: string;
  otherStoneNames: string[];
}

export interface GenerateRelationshipCopyResult {
  copy: RelationshipCopy;
  usedFallback: boolean;
  modelName: string;
  promptVersion: string;
}

async function attemptGenerate(
  input: GenerateRelationshipCopyInput,
  llm: LLMProvider,
): Promise<{ copy: RelationshipCopy; modelName: string } | null> {
  try {
    const result = await llm.generateStructured<unknown>({
      systemPrompt: RELATIONSHIP_SYSTEM_PROMPT,
      userPrompt: buildRelationshipUserPrompt(input),
      jsonSchema: RELATIONSHIP_COPY_JSON_SCHEMA,
      schemaName: "relationship_copy",
      timeoutMs: 6000,
      maxOutputTokens: 400,
    });

    const confirmedNames = [input.myStoneNameKo, input.weStoneNameKo];
    if (input.partnerStoneNameKo) confirmedNames.push(input.partnerStoneNameKo);

    const validation = validateRelationshipCopy(result.data, {
      confirmedStoneNames: confirmedNames,
      otherStoneNames: input.otherStoneNames,
    });

    if (!validation.valid || !validation.data) return null;
    return { copy: validation.data, modelName: result.modelName };
  } catch {
    return null;
  }
}

/** docs/09-ai-prompts-and-safety.md#timeout-및-retry — 1회 재시도 후 fallback 전환. */
export async function generateRelationshipCopy(
  input: GenerateRelationshipCopyInput,
  llm: LLMProvider,
): Promise<GenerateRelationshipCopyResult> {
  const first = await attemptGenerate(input, llm);
  if (first) {
    return {
      copy: first.copy,
      usedFallback: false,
      modelName: first.modelName,
      promptVersion: RELATIONSHIP_PROMPT_VERSION,
    };
  }

  const retry = await attemptGenerate(input, llm);
  if (retry) {
    return {
      copy: retry.copy,
      usedFallback: false,
      modelName: retry.modelName,
      promptVersion: RELATIONSHIP_PROMPT_VERSION,
    };
  }

  return {
    copy: getRelationshipFallbackCopy(input.weStoneSlug),
    usedFallback: true,
    modelName: "fallback",
    promptVersion: RELATIONSHIP_PROMPT_VERSION,
  };
}
