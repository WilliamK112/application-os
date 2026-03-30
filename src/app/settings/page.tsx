import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export const settingsPageAuth = {
  getCurrentUserOrThrow,
};

export default async function SettingsPage() {
  const user = await settingsPageAuth.getCurrentUserOrThrow();
  const profile = await applicationOsService.getProfile(user.id);

  return (
    <AppShell title="Settings">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Profile</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Target Role</dt>
            <dd className="font-medium">{profile?.targetRole ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Locations</dt>
            <dd className="font-medium">{profile?.targetLocations.join(", ") ?? "-"}</dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}
