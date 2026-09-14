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

  it("주 원소가 같은 원석이 여럿이면 slug 알파벳순으로 결정론적으로 선택한다", () => {
    // 원석은 오행 속성을 하나만 가지므로, 같은 원소를 공유하는 원석들은 오행
    // 친화도가 완전히 동일하다 — 이 동점은 기존 동점 처리 규칙(알파벳순)을 따른다.
    const stones: EngineStone[] = [
      { id: "s-a", slug: "aaa", element: "METAL" },
      { id: "s-z", slug: "zzz", element: "METAL" },
    ];
    const result = recommend(
      { context: "five-elements", wish: {}, fiveElement: { neededElement: "METAL" } },
      stones,
      [],
    );
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
