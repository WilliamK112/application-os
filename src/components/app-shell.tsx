import Link from "next/link";
import { type ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/followups", label: "Follow-ups" },
  { href: "/interviews", label: "Interviews" },
  { href: "/documents", label: "Documents" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
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

        <main className="p-6">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-semibold">{title}</h2>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
