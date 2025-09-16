"use client";
import { useEffect, useState } from "react";

type Row = { userId: string; email: string; name: string; url?: string };
type MainModule = { id: number; orderIndex: number; title: string };

export default function AdminCertificates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { eligible: boolean; url?: string }>>({});

  async function load() {
    const res = await fetch("/api/admin/certificates", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows);
    const mm = await fetch("/api/admin/main-modules", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ modules: [] }));
    setMainModules(mm.modules || []);
  }
  useEffect(() => { load(); }, []);

  async function reissue(userId: string) {
    setMessage(null);
    const res = await fetch("/api/admin/certificates/reissue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (!res.ok) { setMessage("Failed to reissue"); return; }
    load();
  }

  async function checkMainStatus(userId: string, mainId: number) {
    try {
      const res = await fetch(`/api/main-modules/${mainId}/certificate/download?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        setStatus((s) => ({ ...s, [`${userId}:${mainId}`]: { eligible: true, url: `/api/main-modules/${mainId}/certificate/download?userId=${encodeURIComponent(userId)}` } }));
        return;
      }
    } catch {}
    setStatus((s) => ({ ...s, [`${userId}:${mainId}`]: { eligible: false } }));
  }

  async function generateMain(userId: string, mainId: number) {
    setMessage(null);
    try { await fetch(`/api/main-modules/${mainId}/certificate`, { method: "POST" }); } catch {}
    await checkMainStatus(userId, mainId);
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

      {rows.length > 0 && (
        <section className="mt-6 rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <h3 className="font-semibold mb-3">Per-Main-Module Certificates</h3>
          <div className="mb-2">
            <label className="mr-2 text-sm text-slate-700">User:</label>
            <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={selectedUser || ''} onChange={(e) => setSelectedUser(e.target.value || null)}>
              <option value="">Select user…</option>
              {rows.map((r) => (
                <option key={r.userId} value={r.userId}>{r.name} ({r.email})</option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Main Module</th>
                    <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Status</th>
                    <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mainModules.map((m) => {
                    const key = `${selectedUser}:${m.id}`;
                    const st = status[key];
                    return (
                      <tr key={m.id}>
                        <td className="px-2 py-2 border-b border-slate-100">{m.orderIndex}. {m.title}</td>
                        <td className="px-2 py-2 border-b border-slate-100">
                          {st ? (st.url ? 'Ready' : (st.eligible ? 'Eligible' : 'Not ready')) : (
                            <button className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50" onClick={() => checkMainStatus(selectedUser, m.id)}>Check</button>
                          )}
                        </td>
                        <td className="px-2 py-2 border-b border-slate-100">
                          {st && st.url ? (
                            <a className="rounded bg-[color:var(--color-brand)] !text-white px-3 py-1.5 text-sm hover:opacity-95" href={st.url} target="_blank">Download</a>
                          ) : (
                            <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => generateMain(selectedUser!, m.id)}>Generate</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

