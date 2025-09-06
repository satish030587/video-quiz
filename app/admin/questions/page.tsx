"use client";
import { useEffect, useState } from "react";

type Module = { id: string; order: number; title: string };
type Question = { id: string; text: string; options: string[]; correctIndex: number; active: boolean };

export default function AdminQuestions() {
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleId, setModuleId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [text, setText] = useState("");
  const [opts, setOpts] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eText, setEText] = useState("");
  const [eOptions, setEOptions] = useState("");
  const [eCorrectIndex, setECorrectIndex] = useState(0);

  async function loadModules() {
    const res = await fetch("/api/admin/modules", { cache: "no-store" });
    const data = await res.json();
    setModules(data.modules);
    if (!moduleId && data.modules.length) setModuleId(data.modules[0].id);
  }
  useEffect(() => { loadModules(); }, []);

  async function loadQuestions() {
    if (!moduleId) return;
    const res = await fetch(`/api/admin/questions?moduleId=${encodeURIComponent(moduleId)}`, { cache: "no-store" });
    const data = await res.json();
    setQuestions(data.questions);
  }
  useEffect(() => { loadQuestions(); }, [moduleId]);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault(); setMessage(null);
    const res = await fetch(`/api/admin/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId, text, options: opts, correctIndex }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Failed to add"); return; }
    setText(""); setOpts(["", "", "", ""]); setCorrectIndex(0);
    loadQuestions();
  }

  async function toggleActive(id: string, active: boolean) {
    setMessage(null);
    const res = await fetch(`/api/admin/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    if (!res.ok) { setMessage("Update failed"); return; }
    loadQuestions();
  }

  async function remove(id: string) {
    setMessage(null);
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("Delete failed"); return; }
    loadQuestions();
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setEText(q.text);
    setEOptions(q.options.join(" | "));
    setECorrectIndex(q.correctIndex);
  }
  async function saveEdit() {
    if (!editingId) return;
    const options = eOptions.split("|").map((s) => s.trim()).filter(Boolean);
    const res = await fetch(`/api/admin/questions/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: eText, options, correctIndex: eCorrectIndex }) });
    if (!res.ok) { setMessage("Save failed"); return; }
    setEditingId(null);
    loadQuestions();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Questions</h1>
      <div className="mb-2">
        <label className="mr-2">Module:</label>
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.order}. {m.title}</option>
          ))}
        </select>
      </div>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] my-4">
        <h3 className="font-semibold mb-2">Add Question</h3>
        <form onSubmit={addQuestion} className="grid gap-3 max-w-[640px]">
          <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} required />
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
              <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder={`Option ${i + 1}`} value={o} onChange={(e) => setOpts((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))} required />
            </div>
          ))}
          <button type="submit" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Add</button>
        </form>
      </section>

      <h3 className="font-semibold mb-2">Existing</h3>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Text</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Options</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Correct</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Active</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="px-2 py-2 border-b border-slate-100">
                  {editingId === q.id ? (
                    <textarea className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={eText} onChange={(e) => setEText(e.target.value)} />
                  ) : (
                    q.text
                  )}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {editingId === q.id ? (
                    <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={eOptions} onChange={(e) => setEOptions(e.target.value)} placeholder="Separate with |" />
                  ) : (
                    q.options.join(" | ")
                  )}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {editingId === q.id ? (
                    <input className="w-24 rounded border border-slate-300 px-2 py-1 text-sm" type="number" min={0} value={eCorrectIndex} onChange={(e) => setECorrectIndex(Number(e.target.value))} />
                  ) : (
                    q.options[q.correctIndex]
                  )}
                </td>
                <td className="px-2 py-2 border-b border-slate-100">{q.active ? "Yes" : "No"}</td>
                <td className="px-2 py-2 border-b border-slate-100">
                  {editingId === q.id ? (
                    <div className="flex gap-2">
                      <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95" onClick={saveEdit}>Save</button>
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => startEdit(q)}>Edit</button>
                      <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => toggleActive(q.id, !q.active)}>{q.active ? "Deactivate" : "Activate"}</button>
                      <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(q.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
