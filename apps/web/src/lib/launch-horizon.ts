import type { CaseStatus, CaseSummary } from "@clearpath/contracts";

export const TOP = 46;
export const BOTTOM = 44;

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUSES: readonly CaseStatus[] = [
  "ready_for_review",
  "needs_information",
  "changes_requested",
  "approved",
];
const PITCH = 28;
const LANE_MIN = 72;
const LANE_PAD = 16;
const MARKER_WIDTH = 30;
const MARKER_GAP = 6;
const MIN_SPAN = 14;
const PX_PER_DAY = 14;
const PLOT_MIN = 560;
const PLOT_MAX = 1600;
const TICK_SPACING = 60;
const EDGE_MARGIN = 0.045;

type Dated = { item: CaseSummary; day: number };
type Placed = { item: CaseSummary; day: number; frac: number; slot: number; cluster: number };
type Tick = { day: number; label: string; year: string };
type Model = {
  dated: Dated[];
  todayDay: number | null;
  window: { start: number; end: number } | null;
  span: number;
  plotMin: number;
  layouts: { placed: Placed[]; heights: number[]; stack: number }[];
  pitch: number;
  laneHeights: number[];
  laneTops: number[];
  inner: number;
  ticks: Tick[];
  showYear: boolean;
  focusDay: number | null;
  focusCount: number;
};

// setUTCFullYear preserves years 0000–0099; Date.UTC treats those years as 1900–1999.
function epochDay(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  return date.getTime() / DAY_MS;
}

function parseDay(value: string): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const result = epochDay(year, month, day);
  const date = new Date(result * DAY_MS);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
    ? result
    : null;
}

function parts(day: number) {
  const date = new Date(day * DAY_MS);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), date: date.getUTCDate() };
}

function formatYear(year: number): string {
  return `${year < 0 ? "-" : ""}${String(Math.abs(year)).padStart(4, "0")}`;
}

export function formatShort(day: number): string {
  const date = parts(day);
  return `${MONTHS[date.month]} ${date.date}`;
}

export function formatFull(day: number): string {
  const date = new Date(day * DAY_MS);
  return `${WEEKDAYS[date.getUTCDay()]}, ${formatShort(day)}, ${formatYear(date.getUTCFullYear())}`;
}

function buildWindow(dated: Dated[], today: number | null): Model["window"] {
  if (dated.length === 0) return null;
  let low = dated[0].day;
  let high = dated[dated.length - 1].day;
  if (today !== null) {
    low = Math.min(low, today);
    high = Math.max(high, today);
  }
  const pad = Math.max(4, Math.ceil((high - low) * 0.1));
  let start = low - pad;
  let end = high + pad;
  const short = MIN_SPAN - (end - start);
  if (short > 0) {
    start -= Math.floor(short / 2);
    end += Math.ceil(short / 2);
  }
  return { start, end };
}

function dayTicks(start: number, end: number, step: number, maxTicks: number): number[] | null {
  // Weekly steps align with Mondays; epoch day 4 was a Monday.
  const offset = step >= 7 ? 4 : 0;
  const first = Math.ceil((start - offset) / step) * step + offset;
  const count = Math.max(0, Math.floor((end - first) / step) + 1);
  return count <= maxTicks
    ? Array.from({ length: count }, (_, index) => first + index * step)
    : null;
}

function monthTicks(start: number, end: number, every: number, maxTicks: number): number[] | null {
  const startDate = parts(start);
  const endDate = parts(end);
  const fromIndex = (index: number) => {
    const year = Math.floor(index / 12);
    return epochDay(year, index - year * 12, 1);
  };
  let first = Math.ceil((startDate.year * 12 + startDate.month) / every) * every;
  if (fromIndex(first) < start) first += every;
  const last = endDate.year * 12 + endDate.month;
  const count = Math.max(0, Math.floor((last - first) / every) + 1);
  return count <= maxTicks
    ? Array.from({ length: count }, (_, index) => fromIndex(first + index * every))
    : null;
}

function buildTicks(start: number, end: number, maxTicks: number, showYear: boolean): Tick[] {
  const toTick = (monthly: boolean) => (day: number): Tick => ({
    day,
    label: monthly ? MONTHS[parts(day).month] : formatShort(day),
    year: showYear ? formatYear(parts(day).year) : "",
  });
  // Reject overfull candidates arithmetically before allocating any tick arrays.
  for (const step of [1, 2, 3, 7, 14]) {
    const found = dayTicks(start, end, step, maxTicks);
    if (found !== null) return found.map(toTick(false));
  }
  for (const every of [1, 2, 3, 6, 12]) {
    const found = monthTicks(start, end, every, maxTicks);
    if (found !== null) return found.map(toTick(true));
  }
  // Extend through 2/5/10-year steps, then decades and centuries, without truncating the range.
  for (let scale = 1;; scale *= 10) {
    for (const factor of [2, 5, 10]) {
      const found = monthTicks(start, end, 12 * factor * scale, maxTicks);
      if (found !== null) return found.map(toTick(true));
    }
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareDated(left: Dated, right: Dated): number {
  return left.day - right.day || compareText(left.item.title, right.item.title) ||
    compareText(left.item.id, right.item.id);
}

function stackLane(items: Dated[], span: number, plotMin: number) {
  const threshold = ((MARKER_WIDTH + MARKER_GAP) * span) / plotMin;
  const placed: Omit<Placed, "frac">[] = [];
  const heights: number[] = [];
  let lastDayBySlot: number[] = [];
  items.forEach(({ item, day }, index) => {
    if (index === 0 || day - items[index - 1].day >= threshold) {
      heights.push(0);
      lastDayBySlot = [];
    }
    const cluster = heights.length - 1;
    let slot = lastDayBySlot.findIndex((lastDay) => day - lastDay >= threshold);
    if (slot < 0) slot = lastDayBySlot.length;
    lastDayBySlot[slot] = day;
    heights[cluster] = Math.max(heights[cluster], slot + 1);
    placed.push({ item, day, slot, cluster });
  });
  return {
    placed,
    heights,
    stack: heights.reduce((maximum, height) => Math.max(maximum, height), 0),
  };
}

/** Derive a target-date snapshot from the whole search/product cohort, independent of status selection. */
export function buildLaunchHorizon(cases: readonly CaseSummary[], today: string): Model {
  const dated: Dated[] = [];
  for (const item of cases) {
    const day = parseDay(item.launchDate);
    if (day !== null) dated.push({ item, day });
  }
  dated.sort(compareDated);
  const todayDay = parseDay(today);
  const window = buildWindow(dated, todayDay);
  const span = window ? window.end - window.start : 0;
  const plotMin = window
    ? Math.min(PLOT_MAX, Math.max(PLOT_MIN, Math.round(span * PX_PER_DAY)))
    : PLOT_MIN;
  const layouts = STATUSES.map((status) => {
    const { placed, heights, stack } = stackLane(
      dated.filter((entry) => entry.item.status === status),
      span || 1,
      plotMin,
    );
    return {
      stack,
      heights,
      placed: placed.map((entry): Placed => ({
        ...entry,
        frac: window ? (entry.day - window.start) / span : 0,
      })),
    };
  });
  const laneHeights = layouts.map((layout) => Math.max(LANE_MIN, layout.stack * PITCH + LANE_PAD));
  let inner = 0;
  const laneTops = laneHeights.map((height) => {
    const top = inner;
    inner += height;
    return top;
  });
  const startYear = window ? parts(window.start).year : 0;
  const endYear = window ? parts(window.end).year : 0;
  const todayYear = todayDay === null ? startYear : parts(todayDay).year;
  const showYear = window !== null && (startYear !== endYear || startYear !== todayYear);
  const ticks = window
    ? buildTicks(
      window.start,
      window.end,
      Math.max(2, Math.floor(plotMin / TICK_SPACING)),
      showYear,
    )
      .filter((tick) => {
        const frac = (tick.day - window.start) / span;
        return frac > EDGE_MARGIN && frac < 1 - EDGE_MARGIN;
      })
    : [];
  const focusDay = dated.find(({ item }) => item.status !== "approved")?.day ?? null;
  const focusCount = focusDay === null
    ? 0
    : dated.filter(({ item, day }) => item.status !== "approved" && day === focusDay).length;

  return {
    dated,
    todayDay,
    window,
    span,
    plotMin,
    layouts,
    pitch: PITCH,
    laneHeights,
    laneTops,
    inner,
    ticks,
    showYear,
    focusDay,
    focusCount,
  };
}
