import { z } from "zod";
import { submissionSchema, type SubmissionInput } from "@clearpath/contracts";

/** Only an unsent form can have an unanswered completeness selection. */
export type SubmissionDraftInput = Omit<SubmissionInput, "completeAsset"> & { completeAsset: boolean | null };

export function createSubmissionDraft(input: SubmissionInput, revision?: number): SubmissionDraftInput {
  return { ...input, completeAsset: revision === undefined ? null : input.completeAsset };
}

const draftInputSchema = submissionSchema.extend({
  title: z.string().max(160), content: z.string().max(20000), publisher: z.string().max(100),
  launchDate: z.string().max(10), completeAsset: z.boolean().nullable(),
});
const storedDraftSchema = z.object({
  version: z.literal(1), scope: z.string().max(300), baseRevision: z.number().int().positive().nullable(),
  updatedAt: z.number().finite(), input: draftInputSchema,
});
export type StoredSubmissionDraft = z.infer<typeof storedDraftSchema>;
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const prefix = "clearpath-unsent-draft:v1:";

export function draftInputsEqual(left: SubmissionDraftInput, right: SubmissionDraftInput) {
  return (Object.keys(left) as (keyof SubmissionDraftInput)[]).every(key => left[key] === right[key]);
}

export function readSubmissionDraft(storage: DraftStorage, scope: string): StoredSubmissionDraft | null {
  try {
    const raw = storage.getItem(prefix + scope);
    if (!raw) return null;
    const result = storedDraftSchema.safeParse(JSON.parse(raw));
    return result.success && result.data.scope === scope ? result.data : null;
  } catch { return null; }
}

/** This tab-local record contains only unsent form fields, never CaseDetail or decisions. */
export function writeSubmissionDraft(storage: DraftStorage, scope: string, input: SubmissionDraftInput, baseRevision?: number) {
  try {
    const draft: StoredSubmissionDraft = { version: 1, scope, baseRevision: baseRevision ?? null, updatedAt: Date.now(), input };
    storage.setItem(prefix + scope, JSON.stringify(draft));
    return true;
  } catch { return false; }
}

export function removeSubmissionDraft(storage: DraftStorage, scope: string) {
  try { storage.removeItem(prefix + scope); return true; } catch { return false; }
}


export type DraftRetention = "session" | "memory";

/** Survives SPA unmounts when browser storage is unavailable. Never authoritative. */
export function createDraftRecoveryCache() {
  const memory = new Map<string, StoredSubmissionDraft | null>();
  return {
    read(storage: DraftStorage | null, scope: string): StoredSubmissionDraft | null {
      const draft = memory.has(scope) ? memory.get(scope) : storage ? readSubmissionDraft(storage, scope) : null;
      return draft ? { ...draft, input: { ...draft.input } } : null;
    },
    write(storage: DraftStorage | null, scope: string, input: SubmissionDraftInput, baseRevision?: number): DraftRetention {
      memory.set(scope, { version: 1, scope, baseRevision: baseRevision ?? null, updatedAt: Date.now(), input: { ...input } });
      return storage && writeSubmissionDraft(storage, scope, input, baseRevision) ? "session" : "memory";
    },
    remove(storage: DraftStorage | null, scope: string) {
      // A tombstone prevents a failed storage removal from restoring an old draft
      // later in this app visit after the user explicitly discarded or submitted it.
      memory.set(scope, null);
      return storage ? removeSubmissionDraft(storage, scope) : false;
    },
  };
}

export const submissionDraftRecovery = createDraftRecoveryCache();
