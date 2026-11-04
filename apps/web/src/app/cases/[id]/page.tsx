import { CaseReview } from "@/components/case-review";

export const metadata = { title: "Submission review" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseReview key={id} id={id} />;
}
