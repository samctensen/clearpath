"use client";

import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import { aiReviewMutationKey, aiReviewMutationOptions, type AiReviewRequest } from "./ai-review-mutation";

export function useAiReviewGeneration() {
  return useMutation(aiReviewMutationOptions(useQueryClient()));
}

/** The case page can observe a request started by a form that has since unmounted. */
export function useAiReviewGenerationState(path: string, revision: number) {
  const states = useMutationState({
    filters: { mutationKey: aiReviewMutationKey },
    select: mutation => ({
      request: mutation.state.variables as AiReviewRequest | undefined,
      status: mutation.state.status,
      error: mutation.state.error,
    }),
  });
  const latest = states.filter(state => state.request?.path === path && state.request.revision === revision).at(-1);
  return { pending: latest?.status === "pending", error: latest?.status === "error" ? latest.error : null };
}
