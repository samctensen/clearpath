import type { SubmissionInput } from "../packages/contracts/mod.ts";
import { submissionSchema } from "../packages/contracts/mod.ts";
import { createDraftRecoveryCache, createSubmissionDraft, draftInputsEqual, readSubmissionDraft, writeSubmissionDraft, removeSubmissionDraft } from "../apps/web/src/lib/submission-draft.ts";

const input: SubmissionInput = {
  title: "Campaign", productId: "unknown", offerId: null, publisher: "Partner", format: "unknown",
  launchDate: "2026-12-01", content: "Copy to review.", completeAsset: true, linksToApplication: null, substantiation: "",
};
function assert(condition: boolean, message: string) { if (!condition) throw new Error(message); }

Deno.test("new drafts require an explicit completeness choice even when starting with an example", () => {
  const draft = createSubmissionDraft(input);
  assert(draft.completeAsset === null, "New completeness must be unanswered");
  assert(!submissionSchema.safeParse(draft).success, "An unanswered draft cannot submit");
});
Deno.test("revision drafts retain both recorded completeness choices", () => {
  for (const completeAsset of [true, false]) {
    assert(createSubmissionDraft({ ...input, completeAsset }, 2).completeAsset === completeAsset, "Retain saved choice");
  }
});
Deno.test("deliberate excerpt and Unknown context remain valid submissions", () => {
  assert(submissionSchema.safeParse({ ...createSubmissionDraft(input), completeAsset: false }).success, "Unknown context is supported");
});

function storage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
Deno.test("draft recovery preserves unfinished fields, whitespace, and the original revision gate", () => {
  const store = storage();
  const unfinished = { ...createSubmissionDraft(input, 3), title: "A", publisher: "", launchDate: "", content: "  Unfinished copy\n", completeAsset: null };
  assert(writeSubmissionDraft(store, "/cases/a", unfinished, 3), "Retain incomplete inputs");
  const restored = readSubmissionDraft(store, "/cases/a");
  assert(restored?.baseRevision === 3, "Recovery must not silently update the base revision");
  assert(restored !== null && draftInputsEqual(restored.input, unfinished), "Restore the exact unsent fields");
});
Deno.test("drafts are isolated by case and new-submission context", () => {
  const store = storage();
  writeSubmissionDraft(store, "/cases/a", createSubmissionDraft(input, 1), 1);
  writeSubmissionDraft(store, "new:card", createSubmissionDraft(input));
  assert(readSubmissionDraft(store, "/cases/b") === null, "Do not restore another case's copy");
  assert(readSubmissionDraft(store, "new:loan") === null, "Do not restore a different new-form context");
  removeSubmissionDraft(store, "/cases/a");
  assert(readSubmissionDraft(store, "/cases/a") === null, "Saving or discarding removes the case draft");
  assert(readSubmissionDraft(store, "new:card") !== null, "Other drafts survive");
});
Deno.test("recovery storage contains form input and revision scope, not authoritative review records", () => {
  const store = storage();
  writeSubmissionDraft(store, "/cases/a", createSubmissionDraft(input, 2), 2);
  const saved = JSON.parse([...store.values.values()][0]);
  assert(Object.keys(saved).sort().join(",") === "baseRevision,input,scope,updatedAt,version", "Store only recovery metadata and form input");
});
Deno.test("corrupt and oversized draft records fail closed without breaking the form", () => {
  const store = storage();
  writeSubmissionDraft(store, "/cases/a", createSubmissionDraft(input, 2), 2);
  const key = [...store.values.keys()][0];
  store.values.set(key, "bad JSON");
  assert(readSubmissionDraft(store, "/cases/a") === null, "Ignore broken JSON");
  writeSubmissionDraft(store, "/cases/a", { ...createSubmissionDraft(input, 2), content: "x".repeat(20001) }, 2);
  assert(readSubmissionDraft(store, "/cases/a") === null, "Reject oversized data");
});
Deno.test("storage failures are reported so leaving cannot promise recovery", () => {
  const unavailable = { getItem: () => { throw new Error("Blocked"); }, setItem: () => { throw new Error("Full"); }, removeItem: () => { throw new Error("Blocked"); } };
  assert(!writeSubmissionDraft(unavailable, "/cases/a", createSubmissionDraft(input, 1), 1), "Retain failure must be explicit");
  assert(readSubmissionDraft(unavailable, "/cases/a") === null, "Read failure must not crash rendering");
});
Deno.test("dirty comparison includes context-only edits and clears when every field is restored", () => {
  const draft = createSubmissionDraft(input, 1);
  assert(draftInputsEqual({ ...draft }, draft), "Untouched copy needs no confirmation");
  assert(!draftInputsEqual({ ...draft, format: "email" }, draft), "Metadata edits are dirty too");
  assert(!draftInputsEqual({ ...draft, completeAsset: false }, draft), "Completeness is part of the draft");
});

Deno.test("memory fallback recovers exact draft and base revision after an SPA editor unmount", () => {
  const recovery = createDraftRecoveryCache();
  const draft = { ...createSubmissionDraft(input, 3), content: "  Keep this unsent edit\n" };
  assert(recovery.write(null, "/cases/a", draft, 3) === "memory", "Report the weaker retention guarantee");
  const reopened = recovery.read(null, "/cases/a");
  assert(reopened?.baseRevision === 3 && draftInputsEqual(reopened.input, draft), "Recover original fields and gate");
  assert(recovery.read(null, "/cases/b") === null, "Scope the fallback to its case");
  assert(createDraftRecoveryCache().read(null, "/cases/a") === null, "Memory is intentionally unavailable after a document reload");
});
Deno.test("memory recovery outranks stale session data and discarded input cannot reappear during this visit", () => {
  const session = storage();
  const recovery = createDraftRecoveryCache();
  const initial = createSubmissionDraft(input, 1);
  recovery.write(session, "/cases/a", initial, 1);
  const blocked = { getItem: session.getItem, setItem: () => { throw new Error("Full"); }, removeItem: () => { throw new Error("Blocked"); } };
  const changed = { ...initial, content: "New unsent copy." };
  assert(recovery.write(blocked, "/cases/a", changed, 1) === "memory", "Keep edits even when storage stops working");
  assert(recovery.read(blocked, "/cases/a")?.input.content === changed.content, "Do not resurrect stale session input");
  recovery.remove(blocked, "/cases/a");
  assert(recovery.read(blocked, "/cases/a") === null, "An explicit discard must remain discarded in this visit");
});

Deno.test("pending recovery can retry session persistence without replacing its unsent input or revision", () => {
  const recovery = createDraftRecoveryCache();
  const draft = { ...createSubmissionDraft(input, 2), content: "Unsent draft from an earlier revision." };
  recovery.write(null, "/cases/pending", draft, 2);
  const pending = recovery.read(null, "/cases/pending")!;
  const session = storage();
  assert(recovery.write(session, pending.scope, pending.input, pending.baseRevision ?? undefined) === "session", "Report actual session persistence after retry");
  const afterReload = createDraftRecoveryCache().read(session, pending.scope);
  assert(afterReload?.baseRevision === 2 && draftInputsEqual(afterReload.input, draft), "Persist the pending recovery payload without rebasing or replacing it");
});
