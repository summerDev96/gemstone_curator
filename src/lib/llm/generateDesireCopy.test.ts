import { describe, expect, it } from "vitest";
import type { LLMGenerateResult, LLMProvider } from "./provider";
import { generateDesireCopy } from "./generateDesireCopy";

const baseInput = {
  stoneSlug: "turquoise",
  stoneNameKo: "터키석",
  stoneNameEn: "Turquoise",
  stoneSummary: "마음을 지키는 원석",
  stoneDescription: "관계를 이어가고 싶을 때 어울려요.",
  desireLabel: "사랑",
  otherStoneNames: ["아마조나이트", "Amazonite"],
};

function mockProvider(
  impl: () => Promise<LLMGenerateResult<unknown>>,
): LLMProvider {
  return { generateStructured: impl as LLMProvider["generateStructured"] };
}

const validCopy = {
  heartSummary: "사랑하는 마음을 지키고 싶은 순간이에요.",
  rationale: "터키석은 관계를 지켜주는 원석으로 여겨져요.",
  comfortLines: ["마음을 천천히 전해도 괜찮아요.", "지금의 마음도 소중해요."],
  microAction: "오늘 5분, 소중한 사람에게 짧은 안부를 전해보세요.",
};

describe("generateDesireCopy", () => {
  it("LLM이 성공하면 생성된 카피를 사용한다", async () => {
    const llm = mockProvider(async () => ({
      data: validCopy,
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateDesireCopy(baseInput, llm);
    expect(result.usedFallback).toBe(false);
    expect(result.copy.heartSummary).toBe(validCopy.heartSummary);
  });

  it("LLM이 계속 실패하면 fallback 카피로 완성된다", async () => {
    const llm = mockProvider(async () => {
      throw new Error("always fails");
    });
    const result = await generateDesireCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
    expect(result.copy.heartSummary).toBeTruthy();
  });
});
