"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

const items: { href: string; label: string; icon: JSX.Element }[] = [
  { href: "/admin?view=dashboard", label: "Dashboard", icon: iconHome() },
  { href: "/admin?view=profile", label: "Profile", icon: iconUser() },
  { href: "/admin?view=users", label: "Users", icon: iconUsers() },
  { href: "/admin?view=modules", label: "Modules", icon: iconLayers() },
  { href: "/admin?view=quizzes", label: "Quizzes", icon: iconClipboard() },
  { href: "/admin?view=questions", label: "Questions", icon: iconQuestion() },
  { href: "/admin?view=reports", label: "Reports", icon: iconChart() },
  { href: "/admin?view=certificates", label: "Certificates", icon: iconCertificate() },
  { href: "/admin?view=settings", label: "Settings", icon: iconCog() },
];

export default function AdminSidebar() {
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
function iconUsers() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 1 0-4-4"/><path d="M3 21a6 6 0 0 1 12 0"/><path d="M15 21a6 6 0 0 1 6 0"/></svg>); }
function iconLayers() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/></svg>); }
function iconClipboard() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/></svg>); }
function iconQuestion() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 9a3 3 0 1 1 6 0c0 3-3 2-3 5"/><line x1="12" y1="17" x2="12" y2="17"/></svg>); }
function iconChart() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="7" width="3" height="11"/><rect x="17" y="10" width="3" height="8"/></svg>); }
function iconCertificate() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M8 12l-3 8 7-3 7 3-3-8"/></svg>); }
function iconCog() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>); }
