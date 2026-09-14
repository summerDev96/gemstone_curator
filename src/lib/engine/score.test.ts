import { describe, expect, it } from "vitest";
import { recommend } from "./score";
import type { EngineStone, EngineStoneTag } from "./types";

const stones: EngineStone[] = [
  { id: "stone-a", slug: "aaa-stone" },
  { id: "stone-b", slug: "bbb-stone" },
  { id: "stone-c", slug: "ccc-stone" },
];

const WISH_1 = "wish-1";
const WISH_2 = "wish-2";
const HEART_1 = "heart-1";

describe("recommend (ENGINE-01: 누락 신호 재정규화)", () => {
  it("보조 소원이 없으면 가중치가 주 소원/감정에 재분배되어 1.0으로 합산된다", () => {
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-a", tagId: WISH_1, weight: 1 },
      { stoneId: "stone-a", tagId: HEART_1, weight: 1 },
    ];
    const result = recommend(
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 } },
      stones,
      stoneTags,
    );
    const sumOfWeights =
      result.breakdown.primaryWish / 1 + result.breakdown.heart / 1;
    expect(sumOfWeights).toBeCloseTo(1.0, 5);
  });
});

describe("recommend (ENGINE-02: 전체 가중치 적용)", () => {
  it("보조 소원까지 있으면 0.5/0.15/0.35 가중치를 그대로 적용한다", () => {
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-a", tagId: WISH_1, weight: 1 },
      { stoneId: "stone-a", tagId: WISH_2, weight: 1 },
      { stoneId: "stone-a", tagId: HEART_1, weight: 1 },
    ];
    const result = recommend(
      {
        context: "basic",
        wish: {
          primaryWishTagId: WISH_1,
          secondaryWishTagId: WISH_2,
          heartTagId: HEART_1,
        },
      },
      stones,
      stoneTags,
    );
    expect(result.breakdown.primaryWish).toBeCloseTo(0.5, 5);
    expect(result.breakdown.secondaryWish).toBeCloseTo(0.15, 5);
    expect(result.breakdown.heart).toBeCloseTo(0.35, 5);
  });
});

describe("recommend (ENGINE-03: 동점 해결)", () => {
  it("점수가 동일하면 slug 오름차순으로 결정론적으로 선택한다", () => {
    // 어떤 원석에도 매칭되는 태그가 없어 전원 0점 동점 상황을 만든다.
    const result = recommend(
      { context: "basic", wish: { primaryWishTagId: "no-match", heartTagId: "no-match" } },
      stones,
      [],
    );
    expect(result.stoneId).toBe("stone-a"); // slug "aaa-stone"이 사전식으로 가장 앞섬
  });

  it("100회 반복 실행해도 항상 동일한 결과를 반환한다 (결정론)", () => {
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-b", tagId: WISH_1, weight: 0.5 },
      { stoneId: "stone-c", tagId: WISH_1, weight: 0.5 },
    ];
    const input = {
      context: "basic" as const,
      wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
    };
    const results = Array.from({ length: 100 }, () =>
      recommend(input, stones, stoneTags).stoneId,
    );
    expect(new Set(results).size).toBe(1);
  });

  it("같은 세션에서 반복 호출해도(recentStoneIds에 해당하는 이력이 있어도) 결과가 흔들리지 않는다", () => {
    // 오행 분석·관계 원석은 생년월일시+소원에 따라 안정적으로 정해져야 하므로,
    // 다른 추천 이력이 존재해도(과거에는 반복 패널티로 결과가 바뀌었다) 항상 같은 원석을 반환해야 한다.
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-a", tagId: WISH_1, weight: 1.0 },
      { stoneId: "stone-b", tagId: WISH_1, weight: 0.9 },
    ];
    const input = {
      context: "basic" as const,
      wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
    };
    const first = recommend(input, stones, stoneTags);
    const second = recommend(input, stones, stoneTags);
    expect(first.stoneId).toBe("stone-a");
    expect(second.stoneId).toBe(first.stoneId);
    expect(second.score).toBe(first.score);
  });
});

describe("recommend (ENGINE-06: 성능)", () => {
  it("원석 100개 기준 100ms 미만으로 연산한다", () => {
    const manyStones: EngineStone[] = Array.from({ length: 100 }, (_, i) => ({
      id: `stone-${i}`,
      slug: `stone-${String(i).padStart(3, "0")}`,
    }));
    const manyTags: EngineStoneTag[] = manyStones.map((s) => ({
      stoneId: s.id,
      tagId: WISH_1,
      weight: Math.random(),
    }));

    const start = performance.now();
    recommend(
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 } },
      manyStones,
      manyTags,
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
