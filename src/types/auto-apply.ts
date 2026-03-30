import type {
  AutoApplyFailureCategory,
  AutoApplyRunLog,
  AutoApplyRunStatus,
} from "@/types/domain";

export type AutoApplyItemResult = {
  jobId: string;
  jobLabel: string;
  status: AutoApplyRunStatus;
  failureCategory?: AutoApplyFailureCategory;
  message: string;
  applicationId?: string;
};

export type AutoApplyHistoryFilter = "ALL" | AutoApplyRunStatus | AutoApplyFailureCategory;

export type AutoApplyResultState = {
  error: string;
  results: AutoApplyItemResult[];
  history: AutoApplyRunLog[];
  historyFilter: AutoApplyHistoryFilter;
};
