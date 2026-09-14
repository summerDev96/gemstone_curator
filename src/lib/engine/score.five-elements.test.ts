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
      },
      stones,
      [],
    );
    expect(result.stoneId).toBe("s-wood");
  });

  it("소원/감정 신호가 있어도 오행 친화도만으로 정해진다(사주 진단 안정성 우선)", () => {
    // 원석과 정확히 일치하는 소원/감정 태그가 있어도, "나의 원석"은 오행 친화도만
    // 반영해야 같은 생년월일이면 그날 고른 소원/감정과 무관하게 항상 같은 결과가 된다.
    const WISH_2 = "wish-2";
    const stones: EngineStone[] = [
      { id: "s-match", slug: "s-match", element: "EARTH" },
      { id: "s-no-oheang-match", slug: "s-no-oheang-match", element: "WATER" },
    ];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s-no-oheang-match", tagId: WISH_1, weight: 1 },
      { stoneId: "s-no-oheang-match", tagId: WISH_2, weight: 1 },
      { stoneId: "s-no-oheang-match", tagId: HEART_1, weight: 1 },
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
      },
      stones,
      stoneTags,
    );
    expect(result.breakdown.primaryWish).toBeUndefined();
    expect(result.breakdown.fiveElement).toBeCloseTo(1.0, 5);
    expect(result.stoneId).toBe("s-match");
  });

  it("주 원소가 같은 원석이 여럿이면 보조 원소 친화도로 더 세분화한다", () => {
    // WOOD generates FIRE → FIRE가 보조 원소면 WOOD 원석이 METAL 원석보다 앞선다.
    const stones: EngineStone[] = [
      { id: "s-metal", slug: "aaa-metal", element: "METAL" }, // 주 원소만 일치(1.0)
      { id: "s-wood", slug: "zzz-wood", element: "WOOD" }, // 주 원소 불일치(0) + 보조 원소 상생(0.5)
    ];
    const result = recommend(
      {
        context: "five-elements",
        wish: {},
        fiveElement: { neededElement: "METAL", secondaryNeededElement: "FIRE" },
      },
      stones,
      [],
    );
    // s-metal: 1.0*0.7 = 0.7, s-wood: 0*0.7 + 0.5*0.3 = 0.15 → s-metal 승리
    expect(result.stoneId).toBe("s-metal");
    expect(result.breakdown.fiveElement).toBeCloseTo(0.7, 5);
  });

  it("주 원소가 동점인 원석들 사이에서는 보조 원소 일치가 알파벳 동점 처리보다 우선한다", () => {
    const stones: EngineStone[] = [
      { id: "s-a", slug: "aaa", element: "METAL" },
      { id: "s-z", slug: "zzz", element: "METAL" },
    ];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s-z", tagId: "goal-placeholder", weight: 0 }, // 태그 영향 없음, 원소만으로 판단
    ];
    const result = recommend(
      {
        context: "five-elements",
        wish: {},
        fiveElement: { neededElement: "METAL", secondaryNeededElement: "WATER" },
      },
      stones,
      stoneTags,
    );
    // 둘 다 METAL이라 주 원소(1.0)와 보조 원소(METAL이 WATER를 상생하므로 0.5)
    // 점수가 완전히 동일 → 여전히 동점이므로 알파벳순으로 결정된다.
    expect(result.stoneId).toBe("s-a");
  });

  it("fiveElement 신호 없이 five-elements 컨텍스트를 호출하면 에러를 던진다", () => {
    expect(() =>
      recommend(
        {
          context: "five-elements",
          wish: { primaryWishTagId: WISH_1, heartTagId: HEART_1 },
        },
        [{ id: "s1", slug: "s1" }],
        [],
      ),
    ).toThrow();
  });
});
