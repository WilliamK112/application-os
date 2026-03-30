export const AUTO_APPLY_HISTORY_FILTER_OPTIONS = [
  "ALL",
  "success",
  "failed",
  "needs_manual",
  "http_failure",
  "network_failure",
  "no_form",
  "manual_handoff",
] as const;

export type AutoApplyHistoryFilterOption = (typeof AUTO_APPLY_HISTORY_FILTER_OPTIONS)[number];
