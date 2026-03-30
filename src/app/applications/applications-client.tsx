"use client";

import { ApplicationList } from "@/components/applications/application-list";
import type { ApplicationWithJob } from "@/types/domain";

export function ApplicationsClient({ rows }: { rows: ApplicationWithJob[] }) {
  return <ApplicationList rows={rows} />;
}
