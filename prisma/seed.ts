import { readFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { prisma } from "../src/lib/db";
import {
  TagsFileSchema,
  StonesFileSchema,
  StoneTagsFileSchema,
  FallbackCopyFileSchema,
  RelationshipFallbackCopyFileSchema,
} from "./seedSchemas";

function readJson(fileName: string): unknown {
  const filePath = path.join(__dirname, "seed-data", fileName);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

async function main() {
  const tagsFile = TagsFileSchema.parse(readJson("tags.json"));
  const stonesFile = StonesFileSchema.parse(readJson("stones.json"));
  const stoneTagsFile = StoneTagsFileSchema.parse(readJson("stone-tags.json"));
  const fallbackFile = FallbackCopyFileSchema.parse(
    readJson("fallback-copy.json"),
  );
  const relationshipFallbackFile = RelationshipFallbackCopyFileSchema.parse(
    readJson("relationship-fallback-copy.json"),
  );

  const stoneSlugs = new Set(stonesFile.stones.map((s) => s.slug));
  for (const entry of fallbackFile.fallbackCopy) {
    if (!stoneSlugs.has(entry.stoneSlug)) {
      throw new Error(
        `fallback-copy.json이 존재하지 않는 원석을 참조합니다: ${entry.stoneSlug}`,
      );
    }
  }
  for (const st of stoneTagsFile.stoneTags) {
    if (!stoneSlugs.has(st.stoneSlug)) {
      throw new Error(
        `stone-tags.json이 존재하지 않는 원석을 참조합니다: ${st.stoneSlug}`,
      );
    }
  }
  const missingFallback = stonesFile.stones.filter(
    (s) => !fallbackFile.fallbackCopy.some((f) => f.stoneSlug === s.slug),
  );
  if (missingFallback.length > 0) {
    throw new Error(
      `fallback 카피가 없는 원석이 있습니다: ${missingFallback.map((s) => s.slug).join(", ")}`,
    );
  }
  const missingRelationshipFallback = stonesFile.stones.filter(
    (s) => !relationshipFallbackFile.fallbackCopy.some((f) => f.stoneSlug === s.slug),
  );
  if (missingRelationshipFallback.length > 0) {
    throw new Error(
      `관계 fallback 카피가 없는 원석이 있습니다: ${missingRelationshipFallback.map((s) => s.slug).join(", ")}`,
    );
  }

  for (const tag of tagsFile.tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { category: tag.category, labelKo: tag.labelKo },
      create: tag,
    });
  }

  for (const stone of stonesFile.stones) {
    await prisma.stone.upsert({
      where: { slug: stone.slug },
      update: { ...stone, isActive: true },
      create: stone,
    });
  }

  // stones.json에서 빠진(더 이상 노출하지 않기로 한) 원석은 삭제 대신 비활성화한다.
  // 이미 생성된 Recommendation/RelationshipAnalysis가 참조 중일 수 있어 FK 삭제가
  // 불가능하고, isActive 필터는 이미 추천 조회 경로에서 사용 중이다.
  const deactivated = await prisma.stone.updateMany({
    where: { slug: { notIn: Array.from(stoneSlugs) }, isActive: true },
    data: { isActive: false },
  });

  const allTags = await prisma.tag.findMany();
  const allStones = await prisma.stone.findMany();
  const tagBySlug = new Map(allTags.map((t) => [t.slug, t]));
  const stoneBySlug = new Map(allStones.map((s) => [s.slug, s]));

  for (const st of stoneTagsFile.stoneTags) {
    const stone = stoneBySlug.get(st.stoneSlug);
    const tag = tagBySlug.get(st.tagSlug);
    if (!stone) throw new Error(`알 수 없는 stoneSlug: ${st.stoneSlug}`);
    if (!tag) throw new Error(`알 수 없는 tagSlug: ${st.tagSlug}`);
    await prisma.stoneTag.upsert({
      where: { stoneId_tagId: { stoneId: stone.id, tagId: tag.id } },
      update: { weight: st.weight },
      create: { stoneId: stone.id, tagId: tag.id, weight: st.weight },
    });
  }

  console.log(
    `시드 완료: 태그 ${allTags.length}개, 원석 ${stonesFile.stones.length}개(비활성화 ${deactivated.count}개), 원석-태그 매핑 ${stoneTagsFile.stoneTags.length}개`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
