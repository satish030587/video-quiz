"use client";
import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 440, margin: "40px auto" }}>
      <h1>Forgot password</h1>
      <p>Enter your email. If it exists, we'll send a reset link.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="your@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <button type="submit" disabled={busy || !email}>Send reset link</button>
        {done && <div style={{ color: "#070" }}>If that email exists, a link has been sent.</div>}
        {error && <div style={{ color: "#900" }}>{error}</div>}
      </form>
    </main>
  );
}

