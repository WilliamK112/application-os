"use client";

import { InterviewList } from "@/components/interviews/interview-list";
import type { Interview } from "@/types/domain";

export function InterviewsClient({
  interviews,
  applicationMap,
  defaultApplicationId,
}: {
  interviews: Interview[];
  applicationMap: Record<string, string>;
  defaultApplicationId?: string;
}) {
  return (
    <InterviewList
      interviews={interviews}
      applicationMap={applicationMap}
      defaultApplicationId={defaultApplicationId}
    />
  );
}
