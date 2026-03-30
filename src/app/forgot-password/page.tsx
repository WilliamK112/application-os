import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { authOptions } from "@/lib/auth/options";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we&apos;ll send password reset instructions.
        </p>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}
