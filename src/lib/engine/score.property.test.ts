import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { recommend } from "./score";
import { normalizeWeights } from "./weights";
import type { EngineStone, EngineStoneTag } from "./types";

const stoneArb = fc
  .uniqueArray(fc.string({ minLength: 1, maxLength: 8 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)), {
    minLength: 1,
    maxLength: 6,
  })
  .map((slugs): EngineStone[] =>
    slugs.map((slug, i) => ({ id: `id-${i}-${slug}`, slug })),
  );

const tagArb = fc.string({ minLength: 1, maxLength: 4 });

describe("recommend 속성 기반 테스트", () => {
  it("동일 입력은 항상 동일한 stoneId를 반환한다 (결정론)", () => {
    fc.assert(
      fc.property(
        stoneArb,
        tagArb,
        fc.option(tagArb, { nil: undefined }),
        tagArb,
        (stones, primaryWishTagId, secondaryWishTagId, heartTagId) => {
          const stoneTags: EngineStoneTag[] = stones.map((s, i) => ({
            stoneId: s.id,
            tagId: i % 2 === 0 ? primaryWishTagId : heartTagId,
            weight: (i % 5) / 5,
          }));
          const input = {
            context: "basic" as const,
            wish: {
              primaryWishTagId,
              secondaryWishTagId: secondaryWishTagId ?? undefined,
              heartTagId,
            },
            recentStoneIds: [],
          };
          const first = recommend(input, stones, stoneTags).stoneId;
          for (let i = 0; i < 5; i++) {
            expect(recommend(input, stones, stoneTags).stoneId).toBe(first);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("재정규화 후 존재하는 신호의 가중치 합은 항상 1.0이다", () => {
    fc.assert(
      fc.property(fc.boolean(), (hasSecondary) => {
        const w = normalizeWeights("basic", hasSecondary);
        const sum = w.primaryWish + w.secondaryWish + w.heart;
        expect(sum).toBeCloseTo(1.0, 5);
      }),
    );
  });

  it("recentStoneIds에 포함된 원석은 동일 rawScore를 가진 미포함 원석보다 finalScore가 낮거나 같다", () => {
    const stones: EngineStone[] = [
      { id: "s1", slug: "s1" },
      { id: "s2", slug: "s2" },
    ];
    const stoneTags: EngineStoneTag[] = [
      { stoneId: "s1", tagId: "w1", weight: 0.8 },
      { stoneId: "s2", tagId: "w1", weight: 0.8 },
    ];
    const result = recommend(
      { context: "basic", wish: { primaryWishTagId: "w1", heartTagId: "h1" }, recentStoneIds: ["s1"] },
      stones,
      stoneTags,
    );
    const s1 = result.candidates.find((c) => c.stoneId === "s1")!;
    const s2 = result.candidates.find((c) => c.stoneId === "s2")!;
    expect(s1.rawScore).toBeCloseTo(s2.rawScore, 5);
    expect(s1.finalScore).toBeLessThanOrEqual(s2.finalScore);
  });
});
