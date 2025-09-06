"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setToken(sp.get("token") || ""); }, [sp]);

  async function verify() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Verification failed");
      setDone(true);
      setTimeout(()=> router.push("/login"), 800);
    } catch (e: any) { setError(e?.message || "Verification failed"); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ maxWidth: 440, margin: "40px auto" }}>
      <h1>Email verification</h1>
      {!token ? (
        <p>Missing token. Please use the link from your email.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <button onClick={verify} disabled={busy}>Verify my email</button>
          {done && <div style={{ color: "#070" }}>Email verified. You can log in now.</div>}
          {error && <div style={{ color: "#900" }}>{error}</div>}
        </div>
      )}
    </main>
  );
}

