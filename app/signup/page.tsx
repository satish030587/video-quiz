"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(sp.get("token") || "");
  }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Missing invite token"); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Signup failed");
      setDone(true);
      // Show success screen first, then redirect handled there
      router.push("/signup/success");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-[color:var(--color-brand)] font-semibold text-lg">Sarvahitha Ayurvedalaya Pvt Ltd</div>
          <div className="text-slate-500 text-sm">Training Portal</div>
        </div>
        <h1 className="text-2xl font-semibold mt-4 mb-4 text-[color:var(--color-brand)] text-center">Complete Signup</h1>
        {!token ? (
          <p className="text-slate-600 text-center">Missing invite token. Please open the link from your email.</p>
        ) : (
          <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <form onSubmit={submit} className="grid gap-3 text-center">
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Create password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95" type="submit" disabled={busy || !name || !password}>Create Account</button>
              {error && <div className="text-red-800 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm">{error}</div>}
              {done && <div className="text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-3 py-2 text-sm">Account created. Redirecting…</div>}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

