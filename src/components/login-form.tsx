"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  initialErrorCode?: string;
  didRegister?: boolean;
};

export function LoginForm({ initialErrorCode, didRegister = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setLocalError("Email is required.");
      return;
    }

    if (!password.trim()) {
      setLocalError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: true,
    });

    if (result?.error) {
      setLocalError("Sign-in failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {didRegister ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Account created. Please sign in.
        </div>
      ) : null}

      {initialErrorCode ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Sign-in failed ({initialErrorCode}). Please check your credentials and try again.
        </div>
      ) : null}

      {localError ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {localError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        <Link href="/forgot-password" className="text-slate-900 underline-offset-2 hover:underline">
          Forgot your password?
        </Link>
      </p>

      <p className="mt-3 text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="text-slate-900 underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
