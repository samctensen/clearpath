"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DashboardResponse } from "@clearpath/contracts";
import { api, errorMessage } from "@/lib/api";
import { dashboardRequest, defaultDashboardFilters } from "@/lib/dashboard";
import { nextReviewInQueue, readQueueContext, writeQueueContext } from "@/lib/queue-context";
import { DashboardIcon } from "./dashboard/dashboard-icon";

/** Fresh eligibility is checked only after a deliberate Next review click. */
export function CaseQueueActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const request = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => () => request.current?.abort(), []);

  async function openNext() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setMessage("");
    setError("");
    const saved = readQueueContext("reviewer");
    const context = saved?.openedCaseId === caseId ? saved : null;
    const filters = context?.filters ?? defaultDashboardFilters;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      const data = await api<DashboardResponse>(dashboardRequest(filters, "reviewer", today).path, { signal: controller.signal });
      if (controller.signal.aborted) return;
      const next = nextReviewInQueue(data.cohort ?? [], filters, caseId);
      if (!next) {
        setMessage("No more actionable reviews in this queue. Return to the queue to change filters.");
        return;
      }
      if (context) writeQueueContext({ ...context, openedCaseId: next.id });
      router.push(`/cases/${encodeURIComponent(next.id)}`);
    } catch (failure) {
      if (!controller.signal.aborted) setError(errorMessage(failure));
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(false);
      }
    }
  }

  return <div>
    <div className="action-row">
      <Link href="/" className="button secondary"><DashboardIcon name="arrow-left" size={15} />Return to queue</Link>
      <button type="button" className="button primary" disabled={pending} onClick={() => void openNext()}>{pending ? "Finding next review…" : "Next review"}<DashboardIcon name="arrow-right" size={15} /></button>
    </div>
    {message && <p className="muted" role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
