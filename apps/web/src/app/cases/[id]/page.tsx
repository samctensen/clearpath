import type { Metadata } from "next";
import type { CaseDetail } from "@clearpath/contracts";
import { CaseReview } from "@/components/case-review";
import { apiOrigin } from "@/lib/api-origin";
import { parseRevisionParam } from "@/lib/reference-pages";

type CasePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision?: string | string[] }>;
};

const FALLBACK = "Submission review";

/**
 * Name the tab after the submission, so a reviewer holding ten cases open can tell
 * them apart. It follows the same revision the heading does — an earlier revision may
 * carry a different title — and a slow or unreachable API costs a generic tab, never
 * the page itself.
 */
export async function generateMetadata({ params, searchParams }: CasePageProps): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const selected = parseRevisionParam(query.revision);
  try {
    const response = await fetch(`${apiOrigin}/api/cases/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return { title: FALLBACK };
    const detail = await response.json() as CaseDetail;
    const current = detail.revisions.at(-1);
    if (!current) return { title: FALLBACK };
    if (selected === null || selected === current.number) return { title: current.input.title };
    // The page answers an unknown revision with "Revision unavailable"; say the same.
    const revision = detail.revisions.find((item) => item.number === selected);
    return { title: revision ? `${revision.input.title} · Revision ${selected}` : "Revision unavailable" };
  } catch {
    return { title: FALLBACK };
  }
}

export default async function CasePage({ params, searchParams }: CasePageProps) {
  const { id } = await params;
  const initialRevision = parseRevisionParam((await searchParams).revision);
  return <CaseReview key={`${id}-${initialRevision}`} id={id} initialRevision={initialRevision} />;
}
