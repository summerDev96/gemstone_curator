import { existsSync, readFileSync } from "node:fs";
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

function readPngDimensions(filePath: string): { width: number; height: number } {
  const bytes = readFileSync(filePath);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.subarray(0, 8)).toEqual(pngSignature);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
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

  it("ASSET-01: 활성 원석마다 slug와 일치하는 정사각형 주얼리 PNG가 있다", () => {
    const parsed = StonesFileSchema.parse(readJson("stones.json"));
    expect(parsed.stones).toHaveLength(23);

    for (const stone of parsed.stones) {
      const expectedUrl = `/images/jewelry/${stone.slug}.png`;
      expect(stone.imageUrl).toBe(expectedUrl);

      const assetPath = path.join(process.cwd(), "public", expectedUrl);
      expect(existsSync(assetPath), `${stone.slug} 이미지가 없습니다`).toBe(true);

      const { width, height } = readPngDimensions(assetPath);
      expect(width, `${stone.slug} 이미지가 정사각형이 아닙니다`).toBe(height);
      expect(width, `${stone.slug} 이미지가 너무 작습니다`).toBeGreaterThanOrEqual(1024);
    }
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
