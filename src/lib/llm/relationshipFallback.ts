import { readFileSync } from "node:fs";
import path from "node:path";
import { RelationshipFallbackCopyFileSchema } from "../../../prisma/seedSchemas";
import type { RelationshipCopy } from "./schema";

let cache: Map<string, RelationshipCopy> | null = null;

function load(): Map<string, RelationshipCopy> {
  if (cache) return cache;
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "seed-data",
    "relationship-fallback-copy.json",
  );
  const parsed = RelationshipFallbackCopyFileSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8")),
  );
  cache = new Map(
    parsed.fallbackCopy.map((entry) => [
      entry.stoneSlug,
      { conversationPrompt: entry.conversationPrompt, microAction: entry.microAction },
    ]),
  );
  return cache;
}

export function getRelationshipFallbackCopy(stoneSlug: string): RelationshipCopy {
  const copy = load().get(stoneSlug);
  if (!copy) {
    throw new Error(`원석 "${stoneSlug}"에 대한 관계 fallback 카피가 없습니다.`);
  }
  return copy;
}
