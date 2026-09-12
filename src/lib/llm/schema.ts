import { z } from "zod";

export const GeneratedRecommendationCopySchema = z.object({
  heartSummary: z.string().min(1).max(120),
  rationale: z.string().min(1).max(160),
  comfortLines: z
    .array(z.string().min(1).max(80))
    .min(2)
    .max(3),
  microAction: z.string().min(1).max(100),
});

export type GeneratedRecommendationCopy = z.infer<
  typeof GeneratedRecommendationCopySchema
>;

/** OpenAI Structured Outputs용 JSON Schema — docs/09-ai-prompts-and-safety.md 그대로. */
export const GENERATED_RECOMMENDATION_COPY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["heartSummary", "rationale", "comfortLines", "microAction"],
  properties: {
    heartSummary: { type: "string", minLength: 1, maxLength: 120 },
    rationale: { type: "string", minLength: 1, maxLength: 160 },
    comfortLines: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string", minLength: 1, maxLength: 80 },
    },
    microAction: { type: "string", minLength: 1, maxLength: 100 },
  },
} as const;
