import { describe, expect, it } from "vitest";
import type { LLMGenerateResult, LLMProvider } from "./provider";
import { generateRelationshipCopy } from "./generateRelationshipCopy";

const baseInput = {
  weStoneSlug: "amethyst",
  myStoneNameKo: "로즈쿼츠",
  weStoneNameKo: "소달라이트",
  weStoneSummary: "소통과 이해의 원석",
  relationshipType: "FRIEND",
  relationshipGoalLabel: "더 가까워지고 싶어요",
  partnerNickname: "민지",
  otherStoneNames: ["자수정", "Amethyst"],
};

function mockProvider(
  impl: () => Promise<LLMGenerateResult<unknown>>,
): LLMProvider {
  return { generateStructured: impl as LLMProvider["generateStructured"] };
}

const validCopy = {
  conversationPrompt: "요즘 서로에게 가장 고마웠던 순간은 언제였나요?",
  microAction: "이번 주 안에 서로에게 짧은 안부를 전해보세요.",
};

describe("generateRelationshipCopy", () => {
  it("LLM이 성공하면 생성된 카피를 사용한다", async () => {
    const llm = mockProvider(async () => ({
      data: validCopy,
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateRelationshipCopy(baseInput, llm);
    expect(result.usedFallback).toBe(false);
    expect(result.copy.conversationPrompt).toBe(validCopy.conversationPrompt);
  });

  it("LLM이 계속 실패하면 fallback 카피로 완성된다", async () => {
    const llm = mockProvider(async () => {
      throw new Error("always fails");
    });
    const result = await generateRelationshipCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
    expect(result.copy.conversationPrompt).toBeTruthy();
    expect(result.copy.microAction).toBeTruthy();
  });

  it("상대방 실명 대신 지칭되지 않은 다른 원석명을 언급하면 fallback으로 전환한다", async () => {
    const llm = mockProvider(async () => ({
      data: { ...validCopy, conversationPrompt: "자수정을 함께 나눠보세요" },
      modelName: "test-model",
      rawFinishReason: "stop",
    }));
    const result = await generateRelationshipCopy(baseInput, llm);
    expect(result.usedFallback).toBe(true);
  });
});
