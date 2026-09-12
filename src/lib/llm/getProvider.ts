import { OpenAIProvider } from "./openaiProvider";
import type { LLMProvider } from "./provider";

let instance: LLMProvider | null = null;

/**
 * 테스트 전용 강제 실패 Provider. E2E-03(LLM 실패 시 fallback)을 결정론적으로
 * 재현하기 위한 장치이며, 프로덕션에서는 절대 활성화되지 않는다.
 */
class AlwaysFailingProvider implements LLMProvider {
  async generateStructured(): Promise<never> {
    throw new Error("FORCE_LLM_FALLBACK_FOR_TESTS: 강제 실패");
  }
}

export function getLLMProvider(): LLMProvider {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FORCE_LLM_FALLBACK_FOR_TESTS === "1"
  ) {
    return new AlwaysFailingProvider();
  }

  if (!instance) {
    instance = new OpenAIProvider();
  }
  return instance;
}
