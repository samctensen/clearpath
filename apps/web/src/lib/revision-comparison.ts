import { formatLabels, productLabels, type Revision, type CheckResult } from "@clearpath/contracts";

export type TextChange = { kind: "unchanged" | "removed" | "added"; text: string };
export type CheckChange = { kind: "new" | "updated" | "unchanged" | "cleared" | "not_checked"; previous?: CheckResult; current?: CheckResult };
export const checkChangeLabels: Record<CheckChange["kind"], string> = {
  new: "Newly flagged",
  updated: "Still flagged · evidence or outcome changed",
  unchanged: "Still flagged · evidence unchanged",
  cleared: "No longer flagged by this check",
  not_checked: "Not checked on the selected revision",
};

/** Exact tokens retain all whitespace and punctuation. Quadratic work is capped;
 * large replacements keep their full text but are grouped instead of aligned. */
export function buildTextDiff(previous: string, current: string): { parts: TextChange[]; grouped: boolean } {
  if (previous === current) return { parts: previous ? [{ kind: "unchanged", text: previous }] : [], grouped: false };
  const tokenize = (text: string) => text.match(/[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]|\s+/gu) ?? [];
  const before = tokenize(previous);
  const after = tokenize(current);
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  const left = before.slice(prefix, before.length - suffix);
  const right = after.slice(prefix, after.length - suffix);
  const parts: TextChange[] = [];
  function append(kind: TextChange["kind"], text: string) {
    if (!text) return;
    const last = parts.at(-1);
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  }
  append("unchanged", before.slice(0, prefix).join(""));
  const grouped = (left.length + 1) * (right.length + 1) > 250_000;
  if (grouped || !left.length || !right.length) {
    append("removed", left.join(""));
    append("added", right.join(""));
  } else {
    const width = right.length + 1;
    const lengths = new Uint32Array((left.length + 1) * width);
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        lengths[i * width + j] = left[i] === right[j]
          ? lengths[(i + 1) * width + j + 1] + 1
          : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < left.length || j < right.length) {
      if (i < left.length && j < right.length && left[i] === right[j]) {
        append("unchanged", left[i]); i++; j++;
      } else if (i < left.length && (j === right.length || lengths[(i + 1) * width + j] >= lengths[i * width + j + 1])) {
        append("removed", left[i++]);
      } else append("added", right[j++]);
    }
  }
  append("unchanged", suffix ? before.slice(before.length - suffix).join("") : "");
  return { parts, grouped };
}

export function compareRevisionMetadata(previous: Revision, current: Revision): { label: string; previous: string; current: string }[] {
  const before = previous.input;
  const after = current.input;
  const bool = (value: boolean | null) => value === null ? "Unknown" : value ? "Yes" : "No";
  const fields: [string, string | null, string | null][] = [
    ["Title", before.title, after.title],
    ["Publisher", before.publisher, after.publisher],
    ["Product", productLabels[before.productId], productLabels[after.productId]],
    ["Offer", before.offerId, after.offerId],
    ["Format", formatLabels[before.format], formatLabels[after.format]],
    ["Target launch", before.launchDate, after.launchDate],
    ["Copy provided", before.completeAsset ? "Complete asset" : "Excerpt only", after.completeAsset ? "Complete asset" : "Excerpt only"],
    ["Links to an application", bool(before.linksToApplication), bool(after.linksToApplication)],
    ["Supporting evidence", before.substantiation || "Not provided", after.substantiation || "Not provided"],
    ["Policy version", previous.analysis.policyVersion, current.analysis.policyVersion],
    ["Offer version", previous.analysis.offerVersion, current.analysis.offerVersion],
    ["Check scope", previous.analysis.scope, current.analysis.scope],
  ];
  return fields.filter(([, from, to]) => from !== to).map(([label, from, to]) => ({ label, previous: from ?? "Unknown", current: to ?? "Unknown" }));
}

function isConcern(check?: CheckResult) {
  return check?.status === "finding" || check?.status === "unknown";
}
function evidence(check: CheckResult) {
  // An offset can move when unrelated text changes; that alone is not new evidence.
  return JSON.stringify([check.status, check.severity, check.kind, check.excerpt?.text, check.explanation, check.suggestion, check.reference.type, check.reference.label, check.reference.url]);
}
export function compareRevisionChecks(previous: Revision, current: Revision): CheckChange[] {
  const before = new Map(previous.analysis.checks.map(check => [check.ruleId, check]));
  const after = new Map(current.analysis.checks.map(check => [check.ruleId, check]));
  const changes: CheckChange[] = [];
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    const prior = before.get(id);
    const selected = after.get(id);
    if (!isConcern(prior) && !isConcern(selected)) continue;
    const kind: CheckChange["kind"] = !selected ? "not_checked" : !isConcern(selected) ? "cleared" : !isConcern(prior) ? "new" : evidence(prior!) !== evidence(selected) ? "updated" : "unchanged";
    changes.push({ kind, previous: prior, current: selected });
  }
  return changes;
}
