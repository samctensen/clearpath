import type { CaseSummary } from "@clearpath/contracts";
import { buildReviewMap } from "../apps/web/src/lib/review-map.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function submission(id: string, overrides: Partial<CaseSummary> = {}): CaseSummary {
  return {
    id,
    title: `Campaign ${id}`,
    publisher: "Northstar",
    productId: "card",
    format: "email",
    launchDate: "2026-11-03",
    status: "ready_for_review",
    revision: 1,
    findings: 0,
    unknowns: 0,
    createdAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-02T12:00:00.000Z",
    ...overrides,
  };
}

Deno.test("empty maps retain four labeled groups with honest zero totals and no selection", () => {
  const model = buildReviewMap([]);
  assertEquals([model.total, model.open, model.followUp, model.plotted, model.initialCaseId], [
    0,
    0,
    0,
    0,
    null,
  ]);
  assertEquals(model.groups, [
    {
      status: "ready_for_review",
      label: "Ready for review",
      items: [],
      visible: [],
      hiddenCount: 0,
      count: 0,
    },
    {
      status: "needs_information",
      label: "Needs information",
      items: [],
      visible: [],
      hiddenCount: 0,
      count: 0,
    },
    {
      status: "changes_requested",
      label: "Changes requested",
      items: [],
      visible: [],
      hiddenCount: 0,
      count: 0,
    },
    {
      status: "approved",
      label: "Copy approved",
      items: [],
      visible: [],
      hiddenCount: 0,
      count: 0,
    },
  ]);
});

Deno.test("status totals separate open work and follow-up without deriving status from findings", () => {
  const model = buildReviewMap([
    submission("approved", { status: "approved", findings: 12 }),
    submission("changes", { status: "changes_requested" }),
    submission("info-1", { status: "needs_information" }),
    submission("info-2", { status: "needs_information" }),
    submission("ready", { findings: 0, unknowns: 0 }),
  ]);
  assertEquals([model.total, model.open, model.followUp, model.plotted], [5, 4, 3, 5]);
  assertEquals(model.groups.map((group) => group.count), [1, 2, 1, 1]);
  assertEquals(model.initialCaseId, "ready");
});

Deno.test("all-approved cohorts have no open work but still select a real approved record", () => {
  const model = buildReviewMap([
    submission("later", { status: "approved", launchDate: "2026-11-04" }),
    submission("earlier", { status: "approved", launchDate: "2026-11-02" }),
  ]);
  assertEquals([model.total, model.open, model.followUp, model.plotted], [2, 0, 0, 2]);
  assertEquals(model.initialCaseId, "earlier");
  assertEquals(model.groups.map((group) => group.count), [0, 0, 0, 2]);
});

Deno.test("valid target dates sort first, then creation timestamps and ids resolve ties", () => {
  const cases = [
    submission("unknown-z", { launchDate: "2026-02-29" }),
    submission("same-z"),
    submission("same-a", { updatedAt: "2030-01-01T00:00:00Z" }),
    submission("same-old", { createdAt: "2026-11-01T12:00:00+02:00" }),
    submission("unknown-a", { launchDate: "2026-04-31" }),
    submission("same-invalid-created", { createdAt: "2026-02-30T00:00:00Z" }),
    submission("early-year", { launchDate: "0099-01-01" }),
    submission("leap", { launchDate: "2000-02-29" }),
    submission("later", { launchDate: "2026-11-04" }),
  ];
  const model = buildReviewMap(cases);
  assertEquals(model.groups[0].items.map((item) => item.id), [
    "early-year",
    "leap",
    "same-old",
    "same-a",
    "same-z",
    "same-invalid-created",
    "later",
    "unknown-a",
    "unknown-z",
  ]);
  assertEquals(buildReviewMap([...cases].reverse()), model);
});

Deno.test("malformed targets remain present after valid dates instead of normalizing into the calendar", () => {
  const malformed = [
    "",
    "bad",
    "2026-2-03",
    "2026-13-01",
    "2026-00-01",
    "2026-11-00",
    "2026-11-32",
    "1900-02-29",
    "2026-11-03T00:00:00Z",
  ];
  const model = buildReviewMap([
    ...malformed.map((launchDate, index) => submission(`invalid-${index}`, { launchDate })),
    submission("valid", { launchDate: "9999-12-31" }),
  ]);
  assertEquals(model.total, 10);
  assertEquals(model.groups[0].count, 10);
  assertEquals(model.groups[0].items[0].id, "valid");
  assertEquals(model.initialCaseId, "valid");
});

Deno.test("large cohorts cap each group at eight while retaining every record and exact remainders", () => {
  const cases = [
    ...Array.from(
      { length: 100 },
      (_, index) => submission(`ready-${String(index).padStart(3, "0")}`),
    ),
    ...Array.from(
      { length: 9 },
      (_, index) => submission(`info-${index}`, { status: "needs_information" }),
    ),
    ...Array.from(
      { length: 2 },
      (_, index) => submission(`changes-${index}`, { status: "changes_requested" }),
    ),
    ...Array.from(
      { length: 11 },
      (_, index) => submission(`approved-${index}`, { status: "approved" }),
    ),
  ];
  const model = buildReviewMap(cases);
  assertEquals([model.total, model.open, model.followUp, model.plotted], [122, 111, 11, 26]);
  assertEquals(model.groups.map((group) => group.count), [100, 9, 2, 11]);
  assertEquals(model.groups.map((group) => group.visible.length), [8, 8, 2, 8]);
  assertEquals(model.groups.map((group) => group.hiddenCount), [92, 1, 0, 3]);
  assertEquals(model.groups.reduce((total, group) => total + group.items.length, 0), 122);
  assertEquals(model.groups[0].visible.map((item) => item.id), [
    "ready-000",
    "ready-001",
    "ready-002",
    "ready-003",
    "ready-004",
    "ready-005",
    "ready-006",
    "ready-007",
  ]);
});

Deno.test("selection honors a present preferred id even when capped, otherwise uses open group order", () => {
  const cases = [
    submission("approved", { status: "approved", launchDate: "2026-01-01" }),
    submission("changes", { status: "changes_requested", launchDate: "2026-01-01" }),
    submission("information", { status: "needs_information", launchDate: "2026-02-01" }),
    ...Array.from({ length: 10 }, (_, index) => submission(`ready-${index}`)),
  ];
  assertEquals(buildReviewMap(cases).initialCaseId, "ready-0");
  assertEquals(buildReviewMap(cases, "missing").initialCaseId, "ready-0");
  assertEquals(buildReviewMap(cases, "approved").initialCaseId, "approved");
  assertEquals(buildReviewMap(cases, "ready-9").initialCaseId, "ready-9");
  assertEquals(buildReviewMap(cases.slice(0, 3)).initialCaseId, "information");
  assertEquals(buildReviewMap([], "missing").initialCaseId, null);
});

Deno.test("grouping and sorting never mutate the caller's cases or records", () => {
  const cases = Object.freeze([
    Object.freeze(submission("late", { launchDate: "2026-12-01" })),
    Object.freeze(submission("early", { launchDate: "2026-11-01" })),
  ]);
  const before = JSON.stringify(cases);
  const model = buildReviewMap(cases);
  model.groups[0].items.reverse();
  model.groups[0].visible.pop();
  assertEquals(JSON.stringify(cases), before);
});
