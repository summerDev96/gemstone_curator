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
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 }, recentStoneIds: [] },
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
        recentStoneIds: [],
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
      { context: "basic", wish: { primaryWishTagId: "no-match", heartTagId: "no-match" }, recentStoneIds: [] },
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
      recentStoneIds: [],
    };
    const results = Array.from({ length: 100 }, () =>
      recommend(input, stones, stoneTags).stoneId,
    );
    expect(new Set(results).size).toBe(1);
  });
});

describe("recommend (ENGINE-04: 반복 추천 패널티)", () => {
  it("최근 1회 등장한 원석은 0.85배 감쇠되어 다른 원석에 역전당할 수 있다", () => {
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-a", tagId: WISH_1, weight: 1.0 },
      { stoneId: "stone-b", tagId: WISH_1, weight: 0.9 },
    ];
    const withoutHistory = recommend(
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 }, recentStoneIds: [] },
      stones,
      stoneTags,
    );
    expect(withoutHistory.stoneId).toBe("stone-a");

    const withHistory = recommend(
      {
        context: "basic",
        wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
        recentStoneIds: ["stone-a"],
      },
      stones,
      stoneTags,
    );
    // 보조 소원이 없어 주 소원 가중치가 재정규화(~0.588)된 상태에서
    // stone-a는 반복 패널티(0.85배)로 감쇠되어 stone-b(패널티 없음)에게 역전당한다.
    expect(withHistory.stoneId).toBe("stone-b");
  });

  it("최근 2회 이상 등장한 원석은 0.7배 감쇠된다", () => {
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "stone-a", tagId: WISH_1, weight: 1.0 },
    ];
    const withoutHistory = recommend(
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 }, recentStoneIds: [] },
      stones,
      stoneTags,
    );
    const withHistory = recommend(
      {
        context: "basic",
        wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
        recentStoneIds: ["stone-a", "stone-a"],
      },
      stones,
      stoneTags,
    );
    expect(withHistory.finalScore).toBeCloseTo(withoutHistory.finalScore * 0.7, 5);
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
      { context: "basic", wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 }, recentStoneIds: [] },
      manyStones,
      manyTags,
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
