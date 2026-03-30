import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { CompanyList } from "@/components/company-list";

export default async function CompaniesPage() {
  const user = await getCurrentUserOrThrow();
  const companies = await applicationOsService.listCompanies(user.id);

  return (
    <AppShell title="Companies">
      <CompanyList companies={companies} userId={user.id} />
    </AppShell>
  );
}
