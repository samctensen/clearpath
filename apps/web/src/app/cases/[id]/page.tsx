import { CaseReview } from "@/components/case-review";
import { parseRevisionParam } from "@/lib/reference-pages";

export const metadata = { title: "Submission review" };

export default async function CasePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision?: string | string[] }>;
}) {
  const { id } = await params;
  const initialRevision = parseRevisionParam((await searchParams).revision);
  return <CaseReview key={`${id}-${initialRevision}`} id={id} initialRevision={initialRevision} />;
}
