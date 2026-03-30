import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { QuestionsClient } from "./questions-client";

export default async function QuestionsPage() {
  const user = await getCurrentUserOrThrow();
  const questions = await applicationOsService.listQuestions(user.id);

  return (
    <AppShell title="Question Bank">
      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading...</div>}>
        <QuestionsClient questions={questions} />
      </Suspense>
    </AppShell>
  );
}
