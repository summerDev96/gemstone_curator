import { z } from "zod";

export const DesireRequestSchema = z.object({
  desire: z.enum([
    "love",
    "romance",
    "health",
    "vitality",
    "study",
    "healing",
    "relationships",
    "protection",
    "defense",
  ]),
});

export type DesireRequest = z.infer<typeof DesireRequestSchema>;
