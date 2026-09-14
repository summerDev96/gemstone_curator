import { z } from "zod";

export const TagSeedSchema = z.object({
  slug: z.string().min(1),
  category: z.enum(["WISH", "EMOTION", "RELATIONSHIP_GOAL"]),
  labelKo: z.string().min(1),
});

export const TagsFileSchema = z.object({
  tags: z.array(TagSeedSchema).min(1),
});

export const StoneSeedSchema = z.object({
  slug: z.string().min(1),
  nameKo: z.string().min(1),
  nameEn: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  element: z.enum(["WOOD", "FIRE", "EARTH", "METAL", "WATER"]).optional(),
  imageUrl: z.string().min(1).optional(),
});

export const StonesFileSchema = z.object({
  stones: z.array(StoneSeedSchema).min(1),
});

export const StoneTagSeedSchema = z.object({
  stoneSlug: z.string().min(1),
  tagSlug: z.string().min(1),
  weight: z.number().min(0).max(1),
});

export const StoneTagsFileSchema = z.object({
  stoneTags: z.array(StoneTagSeedSchema).min(1),
});

export const FallbackCopySeedSchema = z.object({
  stoneSlug: z.string().min(1),
  heartSummary: z.string().min(1).max(120),
  rationale: z.string().min(1).max(160),
  comfortLines: z.array(z.string().min(1).max(80)).min(2).max(3),
  microAction: z.string().min(1).max(100),
});

export const FallbackCopyFileSchema = z.object({
  fallbackCopy: z.array(FallbackCopySeedSchema).min(1),
});

export const RelationshipFallbackCopySeedSchema = z.object({
  stoneSlug: z.string().min(1),
  conversationPrompt: z.string().min(1).max(100),
  microAction: z.string().min(1).max(100),
});

export const RelationshipFallbackCopyFileSchema = z.object({
  fallbackCopy: z.array(RelationshipFallbackCopySeedSchema).min(1),
});
