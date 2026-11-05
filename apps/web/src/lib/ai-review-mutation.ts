import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { AiReviewResponse, DemoRole } from "@clearpath/contracts";
import { api, ApiError } from "./api.ts";
import { replaceResource } from "./resource-query.ts";

export const aiReviewMutationKey = ["clearpath", "ai-review-generation"] as const;
export type AiReviewRequest = { path: string; revision: number; role: DemoRole };

export function aiReviewMutationOptions(client: QueryClient) {
  return mutationOptions({
    mutationKey: aiReviewMutationKey,
    retry: false,
    mutationFn: async ({ path, revision, role }: AiReviewRequest): Promise<AiReviewResponse> => {
      try {
        // This request belongs to the saved revision, not the lifetime of its form.
        return await api<AiReviewResponse>(`${path}/ai-review`, {
          body: { expectedRevision: revision }, role,
        });
      } catch (error) {
        // Local development works without an OpenAI key; submission still succeeds.
        if (error instanceof ApiError && error.status === 503) return { available: false, review: null };
        throw error;
      }
    },
    onSuccess: (data, { path, revision }) => {
      replaceResource(client, `${path}/ai-review?revision=${revision}`, data);
    },
  });
}
