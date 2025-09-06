"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { signOut } from "next-auth/react";

const items: { href: string; label: string; icon: JSX.Element }[] = [
  { href: "/?view=dashboard", label: "Dashboard", icon: iconHome() },
  { href: "/?view=profile", label: "Profile", icon: iconUser() },
  { href: "/?view=certificate", label: "Certificate", icon: iconCertificate() },
];

export default function UserSidebar() {
  const sp = useSearchParams();
  const view = sp.get("view") || "dashboard";

  return (
    <div className="flex flex-col h-full">
      <nav className="flex md:block gap-1 text-sm overflow-x-auto">
        {items.map((it) => {
          const v = new URL(it.href, "http://x").searchParams.get("view") || "dashboard";
          const active = v === view;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "shrink-0 flex items-center gap-3 rounded px-3 py-2 transition-colors whitespace-nowrap " +
                (active
                  ? "bg-slate-100 text-[color:var(--color-brand)] font-medium border-l-4 border-[color:var(--color-brand)]"
                  : "hover:bg-slate-100 text-[color:var(--color-brand)]")
              }
            >
              <span className="w-4 h-4 text-slate-500">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 grid gap-2 text-sm hidden md:grid">
        <button className="text-left rounded px-3 py-2 bg-slate-800 text-white hover:opacity-95" onClick={() => signOut({ callbackUrl: "/login" })}>
          Logout
        </button>
      </div>
    </div>
  );
}

function iconHome() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>); }
function iconUser() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>); }
function iconCertificate() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M8 12l-3 8 7-3 7 3-3-8"/></svg>); }
