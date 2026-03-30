import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { authOptions } from "@/lib/auth/options";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const tokenValue = params.token;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>

        {token ? (
          <>
            <p className="mt-2 text-sm text-slate-600">Choose a new password for your account.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              This reset link is missing a token. Please request a new password reset email.
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Request a new link at{" "}
              <Link
                href="/forgot-password"
                className="text-slate-900 underline-offset-2 hover:underline"
              >
                forgot password
              </Link>
              .
            </p>
          </>
        )}
      </section>
    </main>
  );
}
