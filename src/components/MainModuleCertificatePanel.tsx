"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MainModuleCertificatePanel({ mainModuleId }: { mainModuleId: number }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ eligible?: boolean; url?: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/main-modules/${mainModuleId}/certificate`, { cache: "no-store" });
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
  useEffect(() => { load(); }, [mainModuleId]);

  async function generate() {
    setMessage(null);
    try {
      const res = await fetch(`/api/main-modules/${mainModuleId}/certificate`, { method: "POST" });
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
        <div className="flex items-center gap-3">
          <span className="text-slate-800">Your certificate for this Main Module is ready.</span>
          <a href={data.url} target="_blank" className="inline-flex items-center gap-2 rounded bg-[color:var(--color-brand)] !text-white px-3 py-2 text-sm hover:opacity-95">Download PDF</a>
        </div>
      ) : data.eligible ? (
        <div className="flex items-center gap-3">
          <span className="text-slate-800">Generating your certificate...</span>
          <div className="animate-pulse rounded bg-slate-300 w-24 h-8"></div>
        </div>
      ) : (
        <div className="text-slate-800">Complete all sub-modules to unlock this certificate.</div>
      )}
    </div>
  );
}

