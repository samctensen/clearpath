import { Suspense } from "react";
import { NewSubmission } from "@/components/submission-form";
import { Loading } from "@/components/ui";

export const metadata = { title: "New submission" };

export default function NewPage() {
  return <Suspense fallback={<Loading label="Loading submission form" />}><NewSubmission /></Suspense>;
}
