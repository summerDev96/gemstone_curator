import { describe, expect, it } from "vitest";
import { validateGeneratedCopy } from "./validator";

const baseOptions = {
  confirmedStoneNames: ["로즈쿼츠", "Rose Quartz"],
  otherStoneNames: ["자수정", "Amethyst", "시트린", "Citrine"],
};

const validCopy = {
  heartSummary: "지금 마음을 스스로 돌보고 싶은 순간이에요.",
  rationale: "따뜻한 원석의 기운이 지금의 당신과 잘 어울려요.",
  comfortLines: [
    "지금 이대로도 충분히 잘하고 있어요.",
    "천천히 나아가도 괜찮아요.",
  ],
  microAction: "오늘 잠들기 전, 나에게 짧은 응원의 말을 건네보세요.",
};

describe("validateGeneratedCopy", () => {
  it("정상 카피는 통과한다", () => {
    const result = validateGeneratedCopy(validCopy, baseOptions);
    expect(result.valid).toBe(true);
  });

  it("스키마를 위반하면 실패한다 (comfortLines 1개)", () => {
    const bad = { ...validCopy, comfortLines: ["한 줄뿐이에요"] };
    const result = validateGeneratedCopy(bad, baseOptions);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("schema_violation");
  });

  it("금지 표현이 포함되면 실패한다", () => {
    const bad = { ...validCopy, rationale: "이 원석을 지니면 반드시 합격합니다" };
    const result = validateGeneratedCopy(bad, baseOptions);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("forbidden_phrase");
  });

  it("확정되지 않은 다른 원석명을 언급하면 실패한다", () => {
    const bad = { ...validCopy, rationale: "자수정과 함께라면 더 좋아요" };
    const result = validateGeneratedCopy(bad, baseOptions);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("stone_name_mismatch");
  });

  it("글자수를 초과하면 실패한다", () => {
    const bad = { ...validCopy, heartSummary: "가".repeat(121) };
    const result = validateGeneratedCopy(bad, baseOptions);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("schema_violation");
  });
});
