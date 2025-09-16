"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MainModuleCertificatePanel({ mainModuleId }: { mainModuleId: number }) {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => { 
    // Just check if this main module is completed
    async function checkCompletion() {
      setLoading(true);
      try {
        // Use existing MainModuleProgress data to check if this module is completed
        const res = await fetch(`/api/main-modules/${mainModuleId}/progress`, { cache: "no-store" });
        const json = await res.json();
        setCompleted(!!json.completed);
      } catch (e) {
        console.error("Failed to check module completion status", e);
      } finally {
        setLoading(false);
      }
    }
    
    checkCompletion();
  }, [mainModuleId]);

  if (loading) return <div className="text-slate-600">Loading…</div>;

  return (
    <div className="grid gap-3">
      {completed ? (
        <div className="text-slate-800">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p>This main module is completed.</p>
              <p className="mt-1 text-slate-600 text-sm">Complete all main modules to earn your final certificate.</p>
              <Link href="/certificate" className="inline-flex mt-2 items-center gap-2 rounded bg-[color:var(--color-brand)] !text-white px-3 py-1.5 text-sm hover:opacity-95">
                Check Certificate Status
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-800">Complete all sub-modules to mark this main module as completed.</div>
      )}
    </div>
  );
}

