import { describe, expect, it } from "vitest";
import type { LLMGenerateResult, LLMProvider } from "./provider";
import { generateFiveElementsCopy } from "./generateFiveElementsCopy";

const baseInput = {
  stoneSlug: "amethyst",
  stoneNameKo: "자수정",
  stoneNameEn: "Amethyst",
  stoneSummary: "차분함의 원석",
  stoneDescription: "마음의 평정심을 상징해요.",
  neededElement: "METAL",
  balance: { WOOD: 0.1, FIRE: 0.1, EARTH: 0.2, METAL: 0.1, WATER: 0.5 },
  primaryWishLabel: "마음의 평온",
  otherStoneNames: ["로즈쿼츠", "Rose Quartz"],
};

function mockProvider(
  impl: () => Promise<LLMGenerateResult<unknown>>,
): LLMProvider {
  return { generateStructured: impl as LLMProvider["generateStructured"] };
}

const validCopy = {
  heartSummary: "오행의 균형을 살펴보고 싶은 순간이에요.",
  rationale: "부족한 금 기운을 채워주는 원석이 지금의 당신과 잘 어울려요.",
  comfortLines: ["균형은 천천히 찾아가도 괜찮아요.", "지금의 시도 자체가 의미 있어요."],
  microAction: "오늘 5분, 조용히 앉아 숨을 고르는 시간을 가져보세요.",
};

describe("generateFiveElementsCopy", () => {
  it("LLM이 성공하면 생성된 카피를 사용한다", async () => {
    const llm = mockProvider(async () => ({
      data: validCopy,
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateFiveElementsCopy(baseInput, llm);
    expect(result.usedFallback).toBe(false);
    expect(result.copy.heartSummary).toBe(validCopy.heartSummary);
  });

  it("LLM이 계속 실패하면 fallback 카피로 완성된다", async () => {
    const llm = mockProvider(async () => {
      throw new Error("always fails");
    });
    const result = await generateFiveElementsCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
    expect(result.copy.heartSummary).toBeTruthy();
  });
});
