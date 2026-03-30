"use client";
import Link from "next/link";
import { useState } from "react";
import { type ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/interviews", label: "Interviews" },
  { href: "/questions", label: "Questions" },
  { href: "/companies", label: "Companies" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  title,
  children,
  backHref,
}: {
  title: string;
  children: ReactNode;
  backHref?: string;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        {/* Mobile header bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <h1 className="text-base font-semibold">Application OS</h1>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </header>

        {/* Collapsible mobile nav */}
        {mobileNavOpen && (
          <nav className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <ul className="grid grid-cols-2 gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden border-b-0 border-r border-slate-200 bg-white p-4 md:block">
          <h1 className="mb-4 text-lg font-semibold">Application OS</h1>
          <nav>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="p-4 md:p-6">
          <header className="mb-6 border-b border-slate-200 pb-4">
            {backHref && (
              <Link
                href={backHref}
                className="mb-2 block text-sm text-slate-500 hover:text-slate-700"
              >
                ← Back
              </Link>
            )}
            <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
