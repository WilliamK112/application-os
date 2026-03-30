"use client";

import { InterviewList } from "@/components/interviews/interview-list";
import type { Interview } from "@/types/domain";

export function InterviewsClient({
  interviews,
  applicationMap,
}: {
  interviews: Interview[];
  applicationMap: Record<string, string>;
}) {
  return <InterviewList interviews={interviews} applicationMap={applicationMap} />;
}
