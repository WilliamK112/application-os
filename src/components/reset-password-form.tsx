"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordFormState } from "@/app/reset-password/actions";

type ResetPasswordFormProps = {
  token: string;
};

const INITIAL_STATE: ResetPasswordFormState = {
  error: "",
  success: "",
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, action, isPending] = useActionState(resetPasswordAction, INITIAL_STATE);

  if (state.success) {
    return (
      <>
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Continue to{" "}
          <Link href="/login" className="text-slate-900 underline-offset-2 hover:underline">
            sign in
          </Link>
          .
        </p>
      </>
    );
  }

  return (
    <>
      {state.error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-900"
            placeholder="Type password again"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Back to{" "}
        <Link href="/login" className="text-slate-900 underline-offset-2 hover:underline">
          sign in
        </Link>
      </p>
    </>
  );
}
