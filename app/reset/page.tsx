"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setToken(sp.get("token") || ""); }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Reset failed");
      setDone(true);
      setTimeout(()=> router.push("/login"), 1000);
    } catch (e: any) { setError(e?.message || "Reset failed"); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 440, margin: "40px auto" }}>
      <h1>Reset password</h1>
      {!token ? (
        <p>Missing token. Please use the link from your email.</p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
          <input type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit" disabled={busy || !password}>Update password</button>
          {done && <div style={{ color: "#070" }}>Password updated.</div>}
          {error && <div style={{ color: "#900" }}>{error}</div>}
        </form>
      )}
    </main>
  );
}

