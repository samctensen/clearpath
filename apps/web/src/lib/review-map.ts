import type { CaseStatus, CaseSummary } from "@clearpath/contracts";
import { statusLabels } from "@clearpath/contracts";
import { dashboardRows, dashboardStatuses, defaultDashboardFilters } from "./dashboard.ts";

const VISIBLE_PER_GROUP = 8;

type ReviewMapGroup = {
  status: CaseStatus;
  label: string;
  items: CaseSummary[];
  visible: CaseSummary[];
  hiddenCount: number;
  count: number;
};

/** Group the whole cohort; selecting a status must not change the map's denominator. */
export function buildReviewMap(cases: readonly CaseSummary[], preferredCaseId?: string): {
  total: number;
  open: number;
  followUp: number;
  plotted: number;
  groups: ReviewMapGroup[];
  initialCaseId: string | null;
} {
  const ordered = dashboardRows(cases, defaultDashboardFilters);
  const groups = dashboardStatuses.map((status): ReviewMapGroup => {
    const items = ordered.filter((item) => item.status === status);
    const visible = items.slice(0, VISIBLE_PER_GROUP);
    return {
      status,
      label: statusLabels[status],
      items,
      visible,
      hiddenCount: items.length - visible.length,
      count: items.length,
    };
  });
  const count = (status: CaseStatus) => groups.find((group) => group.status === status)!.count;
  const preferred = cases.find((item) => item.id === preferredCaseId);
  // The fixed group order puts every open status before approved records.
  const first = groups.find((group) => group.count > 0)?.items[0];

  return {
    total: cases.length,
    open: cases.length - count("approved"),
    followUp: count("needs_information") + count("changes_requested"),
    plotted: groups.reduce((total, group) => total + group.visible.length, 0),
    groups,
    initialCaseId: preferred?.id ?? first?.id ?? null,
  };
}
