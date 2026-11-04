import { ReviewQueue } from "@/components/review-queue";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Review overview" };

export default function QueuePage() {
  return <ReviewQueue />;
}
