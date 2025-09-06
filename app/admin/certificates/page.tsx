"use client";
import { useEffect, useState } from "react";

type Row = { userId: string; email: string; name: string; url?: string };

export default function AdminCertificates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/certificates", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows);
  }
  useEffect(() => { load(); }, []);

  async function reissue(userId: string) {
    setMessage(null);
    const res = await fetch("/api/admin/certificates/reissue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (!res.ok) { setMessage("Failed to reissue"); return; }
    load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Certificates</h1>
      {message && <p className="mb-3 text-sm rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2">{message}</p>}
      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">User</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Certificate</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId}>
                <td className="px-2 py-2 border-b border-slate-100">{r.name} ({r.email})</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.url ? <a className="underline" href={r.url} target="_blank">Download</a> : "—"}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => reissue(r.userId)}>Reissue</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

