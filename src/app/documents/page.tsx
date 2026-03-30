import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const user = await getCurrentUserOrThrow();
  const documents = await applicationOsService.getDocuments(user.id);

  return (
    <AppShell title="Documents">
      <DocumentsClient documents={documents} />
    </AppShell>
  );
}