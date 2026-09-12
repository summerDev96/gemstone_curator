import type { LLMGenerateParams, LLMGenerateResult, LLMProvider } from "./provider";

const DEFAULT_COPY = {
  heartSummary: "테스트 요약",
  rationale: "테스트 이유",
  comfortLines: ["위로1", "위로2"],
  microAction: "행동1",
};

/**
 * 테스트 전용 LLMProvider 목. 안전 분류 요청은 항상 isCrisis=false를 반환하고,
 * 그 외(카피 생성) 요청은 스키마를 만족하는 고정 카피를 반환한다.
 */
export function createMockLLMProvider(): LLMProvider {
  return {
    async generateStructured<T>(
      params: LLMGenerateParams,
    ): Promise<LLMGenerateResult<T>> {
      if (params.schemaName === "safety_classification") {
        return {
          data: { isCrisis: false, category: "none", confidence: 0.1 } as T,
          modelName: "fake-model",
          rawFinishReason: "stop",
        };
      }
      return {
        data: DEFAULT_COPY as T,
        modelName: "fake-model",
        rawFinishReason: "stop",
      };
    },
  };
}
