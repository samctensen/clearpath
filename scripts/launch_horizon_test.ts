import type { CaseSummary } from "@clearpath/contracts";
import { buildLaunchHorizon, formatFull, formatShort } from "../apps/web/src/lib/launch-horizon.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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

Deno.test("empty cohorts never invent plotted dates even when today is valid", () => {
  const model = buildLaunchHorizon([], "2026-11-03");
  assertEquals(model.dated, []);
  assertEquals(model.window, null);
  assertEquals(model.ticks, []);
  assertEquals(model.span, 0);
  assertEquals(model.focusDay, null);
  assertEquals(model.focusCount, 0);
  assertEquals(model.layouts.map((layout) => layout.placed.length), [0, 0, 0, 0]);
  assertEquals(model.laneHeights, [56, 56, 56, 56]);
  assertEquals(model.laneTops, [0, 56, 112, 168]);
  assertEquals(model.inner, 224);
});

Deno.test("invalid calendar dates are excluded instead of normalized", () => {
  const invalidDates = [
    "",
    "bad",
    "2026-2-03",
    "2026-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-11-00",
    "2026-11-32",
    "1900-02-29",
    "0001-02-29",
    "2026-11-03T00:00:00Z",
  ];
  const model = buildLaunchHorizon(
    invalidDates.map((launchDate, index) => submission(String(index), { launchDate })),
    "2026-02-29",
  );
  assertEquals(model.dated, []);
  assertEquals(model.todayDay, null);
  assertEquals(model.window, null);
  assertEquals(model.ticks, []);
  assertEquals(model.focusCount, 0);
});

Deno.test("a submission due today has a centered real date and a zero-day delta", () => {
  const model = buildLaunchHorizon([submission("today")], "2026-11-03");
  assert(model.window, "A real target needs a plot window");
  assertEquals(model.span, 14);
  assertEquals(model.focusDay, model.todayDay);
  assertEquals(model.focusCount, 1);
  assertEquals(model.layouts[0].placed[0].frac, 0.5);
  assertEquals(model.layouts[0].placed[0].slot, 0);
  assert(model.ticks.length > 0, "A dated plot needs ticks");
});

Deno.test("focus uses the earliest open cohort date and counts all open statuses on it", () => {
  const cases = [
    submission("approved", { status: "approved", launchDate: "2026-10-01" }),
    submission("later", { launchDate: "2026-11-04" }),
    submission("changes", { status: "changes_requested", launchDate: "2026-11-02" }),
    submission("information", { status: "needs_information", launchDate: "2026-11-02" }),
    submission("approved-same", { status: "approved", launchDate: "2026-11-02" }),
  ];
  const model = buildLaunchHorizon(cases, "2026-11-03");
  assertEquals(formatShort(model.focusDay!), "Nov 2");
  assertEquals(model.focusCount, 2);
  assertEquals(model.layouts.map((layout) => layout.placed.length), [1, 1, 1, 2]);
  const approvedOnly = buildLaunchHorizon([cases[0]], "2026-11-03");
  assertEquals(approvedOnly.focusDay, null);
  assertEquals(approvedOnly.focusCount, 0);
  assertEquals(approvedOnly.dated.length, 1);
});

Deno.test("day deltas stay exact across DST, months, leap days, years, and year 0099", () => {
  const examples = [
    { today: "2026-03-07", target: "2026-03-09", delta: 2 },
    { today: "2026-11-01", target: "2026-11-02", delta: 1 },
    { today: "2026-01-31", target: "2026-02-01", delta: 1 },
    { today: "2024-02-28", target: "2024-03-01", delta: 2 },
    { today: "2026-12-31", target: "2027-01-01", delta: 1 },
    { today: "0099-12-31", target: "0100-01-01", delta: 1 },
    { today: "0000-02-28", target: "0000-03-01", delta: 2 },
    { today: "2026-11-03", target: "2026-11-02", delta: -1 },
  ];
  for (const { today, target, delta } of examples) {
    const model = buildLaunchHorizon([submission("target", { launchDate: target })], today);
    assert(model.todayDay !== null && model.focusDay !== null, `${today} and ${target} must parse`);
    assertEquals(model.focusDay - model.todayDay, delta);
  }
  const ancient = buildLaunchHorizon([submission("ancient", { launchDate: "0000-01-01" })], "");
  assertEquals(formatFull(ancient.focusDay!), "Sat, Jan 1, 0000");
  assertEquals(formatFull(0), "Thu, Jan 1, 1970");
});

Deno.test("same and nearby dates use separate vertical slots without moving their date position", () => {
  const model = buildLaunchHorizon([
    submission("same-c", { launchDate: "2026-01-01" }),
    submission("same-a", { launchDate: "2026-01-01" }),
    submission("same-b", { launchDate: "2026-01-01" }),
    submission("near", { launchDate: "2026-01-02" }),
    submission("distant", { launchDate: "2026-12-31" }),
  ], "2026-01-01");
  assert(model.window, "Dated cases need a window");
  const layout = model.layouts[0];
  assertEquals(layout.placed.slice(0, 4).map((entry) => entry.slot), [0, 1, 2, 3]);
  assertEquals(model.pitch, 28);
  assertEquals(layout.stack, 4);
  assertEquals(model.laneHeights[0], 128);
  for (const entry of layout.placed) {
    assertEquals(entry.frac, (entry.day - model.window.start) / model.span);
  }
  for (let left = 0; left < layout.placed.length; left += 1) {
    for (let right = left + 1; right < layout.placed.length; right += 1) {
      const a = layout.placed[left];
      const b = layout.placed[right];
      if (Math.abs(a.frac - b.frac) * model.plotMin < 36) {
        assert(a.slot !== b.slot, `${a.item.id} and ${b.item.id} overlap horizontally`);
        assert(
          Math.abs(a.slot - b.slot) * model.pitch >= 28,
          "Clickable markers need vertical space",
        );
      }
    }
  }
});

Deno.test("input order cannot change marker slots and a filtered cohort recomputes its focus", () => {
  const cases = [
    submission("z", { title: "Same title" }),
    submission("a", { title: "Same title" }),
    submission("earlier", { launchDate: "2026-11-02", productId: "mortgage" }),
    submission("invalid", { launchDate: "bad" }),
  ];
  assertEquals(
    buildLaunchHorizon(cases, "2026-11-03"),
    buildLaunchHorizon([...cases].reverse(), "2026-11-03"),
  );
  const filtered = buildLaunchHorizon(
    cases.filter((item) => item.productId === "card"),
    "2026-11-03",
  );
  assertEquals(filtered.focusDay, filtered.todayDay);
  assertEquals(filtered.focusCount, 2);
  assertEquals(filtered.layouts[0].placed.map((entry) => entry.item.id), ["a", "z"]);
});

Deno.test("extreme valid date ranges have bounded ticks covering both ends of the timeline", () => {
  const model = buildLaunchHorizon([
    submission("ancient", { launchDate: "0000-01-01" }),
    submission("future", { launchDate: "9999-12-31" }),
  ], "2026-11-03");
  assert(model.window, "Extreme dates are still valid");
  assertEquals(model.dated.length, 2);
  assertEquals(model.showYear, true);
  assert(model.ticks.length >= 2 && model.ticks.length <= 26, "Tick count must remain readable");
  assert(
    model.ticks[0].day < model.window.start + model.span * 0.2,
    "Ticks should reach the start",
  );
  assert(
    model.ticks.at(-1)!.day > model.window.start + model.span * 0.8,
    "Ticks should reach the end",
  );
  for (let index = 1; index < model.ticks.length; index += 1) {
    assert(model.ticks[index].day > model.ticks[index - 1].day, "Ticks must be unique and ordered");
  }
});

Deno.test("building a horizon leaves caller data unchanged", () => {
  const cases = Object.freeze([
    Object.freeze(submission("late", { launchDate: "2026-12-01" })),
    Object.freeze(submission("early", { launchDate: "2026-11-01" })),
  ]);
  const before = JSON.stringify(cases);
  buildLaunchHorizon(cases, "2026-11-03");
  assertEquals(JSON.stringify(cases), before);
});
