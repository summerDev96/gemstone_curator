import OpenAI from "openai";
import {
  LLMSchemaViolationError,
  LLMTimeoutError,
  type LLMGenerateParams,
  type LLMGenerateResult,
  type LLMProvider,
} from "./provider";

function getModel(): string {
  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error(
      "OPENAI_MODEL 환경변수가 설정되지 않았습니다. 사용 가능한 실제 모델명을 직접 지정하세요.",
    );
  }
  return model;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new OpenAI({ apiKey });
}

export class OpenAIProvider implements LLMProvider {
  async generateStructured<T>(
    params: LLMGenerateParams,
  ): Promise<LLMGenerateResult<T>> {
    const client = getClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

    try {
      const reasoningEffort = process.env.OPENAI_REASONING_EFFORT as
        | "none"
        | "minimal"
        | "low"
        | "medium"
        | "high"
        | "xhigh"
        | "max"
        | undefined;

      const completion = await client.chat.completions.create(
        {
          model: getModel(),
          max_completion_tokens: params.maxOutputTokens,
          ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: params.schemaName,
              schema: params.jsonSchema,
              strict: true,
            },
          },
        },
        { signal: controller.signal },
      );

      const choice = completion.choices[0];
      const content = choice?.message?.content;
      if (!content) {
        throw new LLMSchemaViolationError("LLM 응답에 content가 없습니다.");
      }

      let parsed: T;
      try {
        parsed = JSON.parse(content) as T;
      } catch {
        throw new LLMSchemaViolationError("LLM 응답이 유효한 JSON이 아닙니다.");
      }

      const finishReason =
        choice.finish_reason === "length"
          ? "length"
          : choice.finish_reason === "content_filter"
            ? "content_filter"
            : "stop";

      return {
        data: parsed,
        modelName: getModel(),
        rawFinishReason: finishReason,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new LLMTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
