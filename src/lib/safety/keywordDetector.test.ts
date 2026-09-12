import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectCrisisKeywords } from "./keywordDetector";

const fixture = JSON.parse(
  readFileSync(
    path.join(__dirname, "__fixtures__", "safety-cases.json"),
    "utf-8",
  ),
) as {
  cases: {
    id: string;
    input: string;
    expectedIsCrisis: boolean;
    expectedCategory: string;
  }[];
};

describe("detectCrisisKeywords (safety fixture 회귀 테스트)", () => {
  for (const testCase of fixture.cases) {
    it(`${testCase.id}: "${testCase.input}"`, () => {
      const result = detectCrisisKeywords(testCase.input);
      expect(result.isCrisis).toBe(testCase.expectedIsCrisis);
      if (testCase.expectedIsCrisis) {
        expect(result.category).toBe(testCase.expectedCategory);
      }
    });
  }
});
