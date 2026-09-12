import { describe, expect, it } from "vitest";
import { recommend } from "./score";
import type { EngineStone, EngineStoneTag } from "./types";

const WISH_1 = "wish-1";
const HEART_1 = "heart-1";

describe("recommend (ENGINE-05: 오행 친화도, five-elements 컨텍스트)", () => {
  it("원석 오행이 필요한 오행과 정확히 일치하면 최고 점수를 받는다", () => {
    const stones: EngineStone[] = [
      { id: "s-water", slug: "s-water", element: "WATER" },
      { id: "s-fire", slug: "s-fire", element: "FIRE" },
      { id: "s-none", slug: "s-none" },
    ];
    const result = recommend(
      {
        context: "five-elements",
        wish: { primaryWishTagId: "no-match", heartTagId: "no-match" },
        fiveElement: { neededElement: "WATER" },
        recentStoneIds: [],
      },
      stones,
      [],
    );
    expect(result.stoneId).toBe("s-water");
  });

  it("원석 오행이 필요한 오행을 상생(생성)하면 0.5배 친화도를 받아 무관한 원석보다 높다", () => {
    // WOOD generates FIRE → 필요한 오행이 FIRE일 때 WOOD 원석은 0.5, 무관 원소는 0
    const stones: EngineStone[] = [
      { id: "s-wood", slug: "s-wood", element: "WOOD" },
      { id: "s-metal", slug: "s-metal", element: "METAL" },
    ];
    const result = recommend(
      {
        context: "five-elements",
        wish: { primaryWishTagId: "no-match", heartTagId: "no-match" },
        fiveElement: { neededElement: "FIRE" },
        recentStoneIds: [],
      },
      stones,
      [],
    );
    expect(result.stoneId).toBe("s-wood");
  });

  it("소원/감정 신호와 결합될 때 five-elements 가중치(0.35/0.10/0.20/0.35)가 적용된다", () => {
    const WISH_2 = "wish-2";
    const stones: EngineStone[] = [{ id: "s1", slug: "s1", element: "EARTH" }];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s1", tagId: WISH_1, weight: 1 },
      { stoneId: "s1", tagId: WISH_2, weight: 1 },
      { stoneId: "s1", tagId: HEART_1, weight: 1 },
    ];
    const result = recommend(
      {
        context: "five-elements",
        wish: {
          primaryWishTagId: WISH_1,
          secondaryWishTagId: WISH_2,
          heartTagId: HEART_1,
        },
        fiveElement: { neededElement: "EARTH" },
        recentStoneIds: [],
      },
      stones,
      stoneTags,
    );
    expect(result.breakdown.primaryWish).toBeCloseTo(0.35, 5);
    expect(result.breakdown.secondaryWish).toBeCloseTo(0.1, 5);
    expect(result.breakdown.heart).toBeCloseTo(0.2, 5);
    expect(result.breakdown.fiveElement).toBeCloseTo(0.35, 5);
    expect(result.finalScore).toBeCloseTo(1.0, 5);
  });

  it("fiveElement 신호 없이 five-elements 컨텍스트를 호출하면 에러를 던진다", () => {
    expect(() =>
      recommend(
        {
          context: "five-elements",
          wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
          recentStoneIds: [],
        },
        [{ id: "s1", slug: "s1" }],
        [],
      ),
    ).toThrow();
  });
});
