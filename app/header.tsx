"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (isAuthPage || !mounted) return null;

  return (
    <header className="bg-white border-b">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-lg font-semibold text-[color:var(--color-brand)]">
          Sarvahitha Ayurvedalaya Pvt Ltd
        </Link>
        <span className="hidden sm:inline text-sm text-slate-500">· Training Portal</span>
        <div className="ml-auto flex items-center gap-3">
          {!session ? (
            <Link href="/login" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Login</Link>
          ) : (
            <>
              <span className="text-sm text-slate-600 max-w-[40vw] truncate">Hi, {session.user?.name}</span>
              <button type="button" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

