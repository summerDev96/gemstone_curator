import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FallbackCopyFileSchema,
  StonesFileSchema,
  StoneTagsFileSchema,
  TagsFileSchema,
} from "./seedSchemas";

function readJson(fileName: string): unknown {
  return JSON.parse(
    readFileSync(path.join(__dirname, "seed-data", fileName), "utf-8"),
  );
}

describe("seed data schema validation", () => {
  it("tags.json은 스키마를 통과하고 최소 1개 이상의 WISH/EMOTION 태그를 포함한다", () => {
    const parsed = TagsFileSchema.parse(readJson("tags.json"));
    const wishCount = parsed.tags.filter((t) => t.category === "WISH").length;
    const emotionCount = parsed.tags.filter(
      (t) => t.category === "EMOTION",
    ).length;
    expect(wishCount).toBeGreaterThan(0);
    expect(emotionCount).toBeGreaterThan(0);
  });

  it("stones.json은 스키마를 통과하고 slug가 유일하다", () => {
    const parsed = StonesFileSchema.parse(readJson("stones.json"));
    const slugs = parsed.stones.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("stone-tags.json은 스키마를 통과하고 weight가 0~1 범위다", () => {
    const parsed = StoneTagsFileSchema.parse(readJson("stone-tags.json"));
    for (const st of parsed.stoneTags) {
      expect(st.weight).toBeGreaterThanOrEqual(0);
      expect(st.weight).toBeLessThanOrEqual(1);
    }
  });

  it("fallback-copy.json은 스키마를 통과하고 모든 원석을 커버한다", () => {
    const stones = StonesFileSchema.parse(readJson("stones.json"));
    const fallback = FallbackCopyFileSchema.parse(
      readJson("fallback-copy.json"),
    );
    const fallbackSlugs = new Set(
      fallback.fallbackCopy.map((f) => f.stoneSlug),
    );
    for (const stone of stones.stones) {
      expect(fallbackSlugs.has(stone.slug)).toBe(true);
    }
  });
});
