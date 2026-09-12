export interface LLMGenerateParams {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  schemaName: string;
  timeoutMs: number;
  maxOutputTokens: number;
}

export interface LLMGenerateResult<T> {
  data: T;
  modelName: string;
  rawFinishReason: "stop" | "length" | "content_filter" | "error";
}

export interface LLMProvider {
  generateStructured<T>(
    params: LLMGenerateParams,
  ): Promise<LLMGenerateResult<T>>;
}

export class LLMTimeoutError extends Error {
  constructor() {
    super("LLM 요청이 시간 초과되었습니다.");
    this.name = "LLMTimeoutError";
  }
}

export class LLMSchemaViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMSchemaViolationError";
  }
}
