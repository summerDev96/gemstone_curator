import { z } from "zod";

export const RecommendationBasicRequestSchema = z.object({
  primaryWishTagId: z.string().uuid(),
  secondaryWishTagId: z.string().uuid().optional(),
  heartTagId: z.string().uuid(),
  freeText: z.string().max(300).optional(),
});

export type RecommendationBasicRequest = z.infer<
  typeof RecommendationBasicRequestSchema
>;

export const FeedbackRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const ShareLinkRequestSchema = z
  .object({
    scope: z.enum(["basic", "five-elements", "relationship"]),
    relationshipAnalysisId: z.string().uuid().optional(),
  })
  .refine(
    (data) => data.scope !== "relationship" || Boolean(data.relationshipAnalysisId),
    {
      message: "scope가 relationship이면 relationshipAnalysisId가 필요합니다.",
      path: ["relationshipAnalysisId"],
    },
  );

export type ShareLinkRequest = z.infer<typeof ShareLinkRequestSchema>;
