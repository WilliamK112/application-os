"use client";

import { InterviewList } from "@/components/interviews/interview-list";
import type { Interview, InterviewQuestion } from "@/types/domain";

export function InterviewsClient({
  interviews,
  applicationMap,
  defaultApplicationId,
  questionBank,
}: {
  interviews: Interview[];
  applicationMap: Record<string, string>;
  defaultApplicationId?: string;
  questionBank: InterviewQuestion[];
}) {
  return (
    <InterviewList
      interviews={interviews}
      applicationMap={applicationMap}
      defaultApplicationId={defaultApplicationId}
      questionBank={questionBank}
    />
  );
}
