"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CertificatePanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ eligible?: boolean; url?: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/certificate`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setMessage("Failed to load certificate status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    setMessage(null);
    try {
      const res = await fetch(`/api/certificate`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage(j.message || "Generate failed");
        return;
      }
      await load();
    } catch {
      setMessage("Generate failed");
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading certificate.</div>;

  return (
    <div>
      {message && <p style={{ color: "#b00" }}>{message}</p>}
      {data.url ? (
        <p>Your certificate is ready: <a href={data.url} target="_blank">Download PDF</a></p>
      ) : data.eligible ? (
        <button onClick={generate}>Generate Certificate</button>
      ) : (
        <p>Complete all modules to unlock your certificate.</p>
      )}
      <div style={{ marginTop: 8 }}>
        <Link href="/">Back to Dashboard</Link>
      </div>
    </div>
  );
}

