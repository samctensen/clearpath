import { ReviewQueue } from "@/components/review-queue";
import type { Metadata } from "next";

// Spelled out because a layout's title template covers its child segments but not its
// own page, so the root template never reaches this one.
export const metadata: Metadata = { title: "Review desk | ClearPath" };

export default function QueuePage() {
  return <ReviewQueue />;
}
