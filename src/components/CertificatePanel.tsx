"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8"/>
      <path d="M12 17v4"/>
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z"/>
      <path d="M5 7a3 3 0 0 1-3-3h5"/>
      <path d="M19 7a3 3 0 0 0 3-3h-5"/>
    </svg>
  );
}

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
      
      // Auto-generate certificate if eligible but not yet generated
      if (json.eligible && !json.url) {
        await generate();
      }
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

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!data) return <div className="text-red-800 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm">Error loading certificate.</div>;

  return (
    <div className="grid gap-3">
      {message && (
        <div className="text-red-800 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm">{message}</div>
      )}

      {data.url ? (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-emerald-700"><TrophyIcon /></div>
          <div>
            <p className="text-slate-900">Your certificate is ready.</p>
            <div className="mt-3 flex gap-3">
              <a
                href={data.url}
                target="_blank"
                className="inline-flex items-center gap-2 rounded bg-[color:var(--color-brand)] text-white !text-white px-3 py-2 text-sm hover:opacity-95"
                aria-label="Download certificate PDF"
              >
                Download PDF
              </a>
              <Link href="/" className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : data.eligible ? (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-emerald-700"><TrophyIcon /></div>
          <div>
            <p className="text-slate-900">Generating your certificate...</p>
            <div className="mt-3">
              <div className="animate-pulse rounded bg-slate-300 w-36 h-9"></div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-slate-800">Complete all main modules to unlock your final certificate.</p>
          <div className="mt-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded bg-[color:var(--color-brand)] text-white !text-white px-3 py-2 text-sm hover:opacity-95" aria-label="Go to Dashboard">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

