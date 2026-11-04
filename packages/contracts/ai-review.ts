import { z } from "zod";

const prose = z.string().min(1).max(1600);
const title = z.string().min(1).max(160);
const quote = z.string().min(1).max(2000).nullable();

export const aiReviewContentSchema = z.object({
  compliance: z.object({
    summary: prose,
    concerns: z.array(
      z.object({
        title,
        quote,
        explanation: prose,
        suggestedChange: prose,
        referenceIds: z.array(z.string().min(1).max(100)).max(7),
        severity: z.enum(["high", "medium", "low"]),
      }).strict(),
    ).max(6),
    questions: z.array(prose).max(5),
  }).strict(),
  marketing: z.object({
    summary: prose,
    strengths: z.array(prose).max(5),
    suggestions: z.array(
      z.object({
        title,
        quote,
        rationale: prose,
        suggestedRewrite: prose,
      }).strict(),
    ).max(6),
  }).strict(),
}).strict();

export type AiReviewContent = z.infer<typeof aiReviewContentSchema>;
export interface AiReview extends AiReviewContent {
  revision: number;
  contentHash: string;
  model: string;
  promptVersion: string;
  createdAt: string;
}
export interface AiReviewResponse {
  available: boolean;
  review: AiReview | null;
}
