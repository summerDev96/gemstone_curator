import { describe, expect, it } from "vitest";
import { recommend } from "./score";
import type { EngineStone, EngineStoneTag } from "./types";

describe("recommend (relationship 컨텍스트)", () => {
  it("relationship 신호 없이 호출하면 에러를 던진다", () => {
    expect(() =>
      recommend(
        { context: "relationship", wish: {} },
        [{ id: "s1", slug: "s1" }],
        [],
      ),
    ).toThrow();
  });

  it("관계 목표에 가장 잘 맞는 원석을 선택한다", () => {
    const stones: EngineStone[] = [
      { id: "s-goal", slug: "s-goal" },
      { id: "s-none", slug: "s-none" },
    ];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s-goal", tagId: "goal-1", weight: 1 },
    ];
    const result = recommend(
      {
        context: "relationship",
        wish: {},
        relationship: { relationshipGoalTagId: "goal-1" },
      },
      stones,
      stoneTags,
    );
    expect(result.stoneId).toBe("s-goal");
  });

  it("소원/감정/오행/관계목표가 모두 있으면 가중치 0.20/0.05/0.15/0.25/0.35가 적용된다", () => {
    const stones: EngineStone[] = [{ id: "s1", slug: "s1", element: "EARTH" }];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s1", tagId: "wish-1", weight: 1 },
      { stoneId: "s1", tagId: "wish-2", weight: 1 },
      { stoneId: "s1", tagId: "heart-1", weight: 1 },
      { stoneId: "s1", tagId: "goal-1", weight: 1 },
    ];
    const result = recommend(
      {
        context: "relationship",
        wish: {
          primaryWishTagId: "wish-1",
          secondaryWishTagId: "wish-2",
          heartTagId: "heart-1",
        },
        fiveElement: { neededElement: "EARTH" },
        relationship: { relationshipGoalTagId: "goal-1" },
      },
      stones,
      stoneTags,
    );
    expect(result.breakdown.primaryWish).toBeCloseTo(0.2, 5);
    expect(result.breakdown.secondaryWish).toBeCloseTo(0.05, 5);
    expect(result.breakdown.heart).toBeCloseTo(0.15, 5);
    expect(result.breakdown.fiveElement).toBeCloseTo(0.25, 5);
    expect(result.breakdown.relationshipGoal).toBeCloseTo(0.35, 5);
    expect(result.score).toBeCloseTo(1.0, 5);
  });

  it("상대방의 필요 기운도 함께 주어지면 두 사람의 오행 친화도 평균을 사용한다", () => {
    // 다른 신호를 모두 채워 가중치가 재정규화 없이 원안 그대로(0.25) 적용되게 한다.
    const stones: EngineStone[] = [{ id: "s1", slug: "s1", element: "EARTH" }];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s1", tagId: "wish-1", weight: 1 },
      { stoneId: "s1", tagId: "wish-2", weight: 1 },
      { stoneId: "s1", tagId: "heart-1", weight: 1 },
      { stoneId: "s1", tagId: "goal-1", weight: 1 },
    ];
    const result = recommend(
      {
        context: "relationship",
        wish: {
          primaryWishTagId: "wish-1",
          secondaryWishTagId: "wish-2",
          heartTagId: "heart-1",
        },
        // 내 필요 기운(EARTH)과는 완전 일치(1.0), 상대 필요 기운(WATER)과는 상생 방향이
        // 아니라 불일치(0) → 평균 0.5.
        fiveElement: { neededElement: "EARTH", partnerNeededElement: "WATER" },
        relationship: { relationshipGoalTagId: "goal-1" },
      },
      stones,
      stoneTags,
    );
    expect(result.breakdown.fiveElement).toBeCloseTo(0.25 * 0.5, 5);
  });

  it("오행 신호 없이도 동작하며(선택적), 남은 가중치로 재정규화된다", () => {
    const stones: EngineStone[] = [{ id: "s1", slug: "s1" }];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s1", tagId: "goal-1", weight: 1 },
    ];
    const result = recommend(
      {
        context: "relationship",
        wish: { heartTagId: "no-match" },
        relationship: { relationshipGoalTagId: "goal-1" },
      },
      stones,
      stoneTags,
    );
    // fiveElement(0.25)와 secondaryWish(0.05)가 없어 나머지(primaryWish 0.20, heart 0.15,
    // relationshipGoal 0.35 = 0.70)에 비례 배분된다.
    expect(result.breakdown.relationshipGoal).toBeCloseTo(1.0 * (0.35 / 0.7), 5);
  });
});

describe("recommend (partner-five-elements 컨텍스트)", () => {
  it("소원/감정 신호 없이 오행 친화도만으로 판단한다", () => {
    const stones: EngineStone[] = [
      { id: "s-water", slug: "s-water", element: "WATER" },
      { id: "s-fire", slug: "s-fire", element: "FIRE" },
    ];
    const result = recommend(
      {
        context: "partner-five-elements",
        wish: {},
        fiveElement: { neededElement: "WATER" },
      },
      stones,
      [],
    );
    expect(result.stoneId).toBe("s-water");
    expect(result.breakdown.fiveElement).toBeCloseTo(1.0, 5);
    expect(result.breakdown.primaryWish).toBeUndefined();
  });

  it("fiveElement 신호 없이 호출하면 에러를 던진다", () => {
    expect(() =>
      recommend(
        { context: "partner-five-elements", wish: {} },
        [{ id: "s1", slug: "s1" }],
        [],
      ),
    ).toThrow();
  });

  it("주 원소가 같은 원석이 여럿이면 slug 알파벳순으로 결정론적으로 선택한다", () => {
    const stones: EngineStone[] = [
      { id: "s-a-metal", slug: "aaa-metal", element: "METAL" },
      { id: "s-z-metal", slug: "zzz-metal", element: "METAL" },
    ];
    const result = recommend(
      {
        context: "partner-five-elements",
        wish: {},
        fiveElement: { neededElement: "METAL" },
      },
      stones,
      [],
    );
    expect(result.stoneId).toBe("s-a-metal");
  });
});
