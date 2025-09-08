"use client";
import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Request failed");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-[color:var(--color-brand)] font-semibold text-lg">Sarvahitha Ayurvedalaya Pvt Ltd</div>
          <div className="text-slate-500 text-sm">Quiz Portal</div>
        </div>
        <h1 className="text-2xl font-semibold mt-4 mb-4 text-[color:var(--color-brand)] text-center">Forgot Password</h1>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-slate-600 text-sm text-center mb-3">Enter your email. If it exists, we will send a reset link.</p>
          <form onSubmit={submit} className="grid gap-3 text-center">
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95 disabled:opacity-60"
              type="submit"
              disabled={busy || !email}
            >
              Send reset link
            </button>
            {done && (
              <div className="text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-3 py-2 text-sm">
                If that email exists, a link has been sent.
              </div>
            )}
            {error && (
              <div className="text-red-800 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm">{error}</div>
            )}
          </form>
          <div className="mt-3 text-center text-sm">
            <a className="underline" href="/login">Back to login</a>
          </div>
        </div>
      </div>
    </main>
  );
}

