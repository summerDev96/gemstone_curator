import { describe, expect, it } from "vitest";
import type { LLMGenerateResult, LLMProvider } from "../llm/provider";
import { classifyInput } from "./classifyInput";

function mockProvider(
  impl: () => Promise<LLMGenerateResult<unknown>>,
): LLMProvider {
  return { generateStructured: impl as LLMProvider["generateStructured"] };
}

describe("classifyInput", () => {
  it("키워드로 위기가 감지되면 LLM을 호출하지 않고 즉시 위기로 판단한다", async () => {
    let called = false;
    const llm = mockProvider(async () => {
      called = true;
      return { data: { isCrisis: false, category: "none", confidence: 1 }, modelName: "test", rawFinishReason: "stop" };
    });
    const result = await classifyInput("죽고 싶어요", llm);
    expect(result.isCrisis).toBe(true);
    expect(called).toBe(false);
  });

  it("키워드가 없으면 LLM 분류 결과를 따른다", async () => {
    const llm = mockProvider(async () => ({
      data: { isCrisis: true, category: "suicide", confidence: 0.9 },
      modelName: "test",
      rawFinishReason: "stop",
    }));
    const result = await classifyInput("평범한 하루였어요", llm);
    expect(result.isCrisis).toBe(true);
    expect(result.category).toBe("suicide");
  });

  it("LLM 분류가 실패하면 보수적으로 위기로 간주한다 (fail-safe)", async () => {
    const llm = mockProvider(async () => {
      throw new Error("timeout");
    });
    const result = await classifyInput("평범한 하루였어요", llm);
    expect(result.isCrisis).toBe(true);
  });

  it("키워드도 없고 LLM도 위기가 아니라고 판단하면 안전한 일반 흐름으로 진행한다", async () => {
    const llm = mockProvider(async () => ({
      data: { isCrisis: false, category: "none", confidence: 0.95 },
      modelName: "test",
      rawFinishReason: "stop",
    }));
    const result = await classifyInput("새로운 시작이 기대돼요", llm);
    expect(result.isCrisis).toBe(false);
  });
});
