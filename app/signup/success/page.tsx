"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupSuccess() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push("/login"), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2 text-[color:var(--color-brand)]">Account Created</h1>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-slate-700">Your account was set up successfully.</p>
          <p className="text-slate-600 mt-1">You will be redirected to the login page shortly.</p>
          <button className="mt-3 rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95" onClick={() => router.push("/login")}>Go to Login now</button>
        </div>
      </div>
    </main>
  );
}

