"use client";
import { useEffect, useState } from "react";

type QuizRow = { id: string; moduleId: string; moduleTitle: string; order: number; passScore: number };

export default function AdminQuizzes() {
  const [rows, setRows] = useState<QuizRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/quizzes", { cache: "no-store" });
    const data = await res.json();
    setRows(data.quizzes);
  }
  useEffect(() => { load(); }, []);

  async function save(id: string, passScore: number) {
    setMessage(null);
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passScore }) });
    if (!res.ok) { setMessage("Failed to save"); return; }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this quiz? All its questions and attempts will be removed.")) return;
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("Delete failed"); return; }
    load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Quizzes</h1>
      {message && <p className="mb-3 text-sm rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2">{message}</p>}
      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Module</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Pass Score</th>
              {/* Timer removed */}
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 border-b border-slate-100">{r.order}. {r.moduleTitle}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <input className="rounded border border-slate-300 px-2 py-1 text-sm w-24" defaultValue={r.passScore} type="number" min={1} max={100} onBlur={(e) => save(r.id, Number(e.currentTarget.value))} />
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  <div className="flex gap-2">
                    <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => save(r.id, r.passScore)}>Save</button>
                    <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
