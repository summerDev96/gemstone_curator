import { describe, expect, it } from "vitest";
import type { LLMGenerateResult, LLMProvider } from "./provider";
import { generateBasicCopy } from "./generateBasicCopy";

const baseInput = {
  stoneSlug: "rose-quartz",
  stoneNameKo: "로즈쿼츠",
  stoneNameEn: "Rose Quartz",
  stoneSummary: "위로의 원석",
  stoneDescription: "자기 자신을 향한 다정함을 상징해요.",
  primaryWishLabel: "지친 마음 회복",
  heartLabel: "많이 지쳐 있어요",
  otherStoneNames: ["자수정", "Amethyst"],
};

function mockProvider(
  impl: () => Promise<LLMGenerateResult<unknown>>,
): LLMProvider {
  return { generateStructured: impl as LLMProvider["generateStructured"] };
}

const validCopy = {
  heartSummary: "지친 마음을 알아차린 소중한 순간이에요.",
  rationale: "따뜻한 원석의 기운이 지금의 당신과 잘 어울려요.",
  comfortLines: ["지금 이대로도 충분해요.", "천천히 나아가도 괜찮아요."],
  microAction: "오늘 나에게 짧은 응원의 말을 건네보세요.",
};

describe("generateBasicCopy", () => {
  it("LLM이 성공하면 생성된 카피를 사용하고 usedFallback은 false다", async () => {
    const llm = mockProvider(async () => ({
      data: validCopy,
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateBasicCopy(baseInput, llm);
    expect(result.usedFallback).toBe(false);
    expect(result.copy.heartSummary).toBe(validCopy.heartSummary);
  });

  it("1차 실패 후 재시도가 성공하면 재시도 결과를 사용한다", async () => {
    let calls = 0;
    const llm = mockProvider(async () => {
      calls += 1;
      if (calls === 1) throw new Error("timeout");
      return { data: validCopy, modelName: "test-model", rawFinishReason: "stop" };
    });
    const result = await generateBasicCopy(baseInput, llm);
    expect(calls).toBe(2);
    expect(result.usedFallback).toBe(false);
  });

  it("재시도까지 모두 실패하면 fallback 카피로 결과를 완성한다", async () => {
    const llm = mockProvider(async () => {
      throw new Error("always fails");
    });
    const result = await generateBasicCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
    expect(result.copy.heartSummary).toBeTruthy();
    expect(result.copy.comfortLines.length).toBeGreaterThanOrEqual(2);
  });

  it("금지 표현이 포함된 응답은 재시도 후 fallback으로 전환한다", async () => {
    const llm = mockProvider(async () => ({
      data: { ...validCopy, rationale: "반드시 합격합니다" },
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateBasicCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
  });
});
