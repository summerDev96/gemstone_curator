import { readFileSync } from "node:fs";
import path from "node:path";
import { FallbackCopyFileSchema } from "../../../prisma/seedSchemas";
import type { GeneratedRecommendationCopy } from "./schema";

let cache: Map<string, GeneratedRecommendationCopy> | null = null;

function load(): Map<string, GeneratedRecommendationCopy> {
  if (cache) return cache;
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "fallback-copy.json",
  );
  const parsed = FallbackCopyFileSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8")),
  );
  cache = new Map(
    parsed.fallbackCopy.map((entry) => [
      entry.stoneSlug,
      {
        heartSummary: entry.heartSummary,
        rationale: entry.rationale,
        comfortLines: entry.comfortLines as [string, string] | [string, string, string],
        microAction: entry.microAction,
      },
    ]),
  );
  return cache;
}

export function getFallbackCopy(
  stoneSlug: string,
): GeneratedRecommendationCopy {
  const copy = load().get(stoneSlug);
  if (!copy) {
    throw new Error(`원석 "${stoneSlug}"에 대한 fallback 카피가 없습니다.`);
  }
  return copy;
}
