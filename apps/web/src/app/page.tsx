import { ReviewQueue } from "@/components/review-queue";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Review desk" };

export default function QueuePage() {
  return <ReviewQueue />;
}
