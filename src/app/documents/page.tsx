import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export const documentsPageAuth = {
  getCurrentUserOrThrow,
};

export default async function DocumentsPage() {
  const user = await documentsPageAuth.getCurrentUserOrThrow();
  const documents = await applicationOsService.getDocuments(user.id);

  return (
    <AppShell title="Documents">
      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((document) => (
          <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">{document.name}</h3>
            <p className="mt-1 text-sm text-slate-600">Type: {document.type}</p>
            <p className="text-sm text-slate-600">Version: {document.version ?? "-"}</p>
            <p className="mt-2 text-xs text-slate-500">Tags: {document.tags.join(", ") || "-"}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
