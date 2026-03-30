import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { authOptions } from "@/lib/auth/options";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const didRegister = params.registered === "1";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your email and password.
        </p>

        <LoginForm initialErrorCode={errorCode} didRegister={didRegister} />
      </section>
    </main>
  );
}
