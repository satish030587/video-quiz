"use client";
import { useEffect, useState } from "react";

type Module = { id: string; order: number; title: string; description?: string | null; youtubeId: string; published: boolean };

export default function AdminModules() {
  const [mods, setMods] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeId, setYouTubeId] = useState("");
  const [order, setOrder] = useState<number | "">("");
  const [published, setPublished] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eYouTubeId, setEYouTubeId] = useState("");
  const [eOrder, setEOrder] = useState<number>(1);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/modules", { cache: "no-store" });
    const data = await res.json();
    setMods(data.modules);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMessage(null);
    const res = await fetch("/api/admin/modules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, youtubeId, order: order === "" ? undefined : Number(order), published }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Failed to create"); return; }
    setTitle(""); setDescription(""); setYouTubeId(""); setOrder(""); setPublished(true);
    load();
  }

  async function update(id: string, patch: Partial<Module>) {
    const res = await fetch(`/api/admin/modules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) { setMessage("Update failed"); return; }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this module? This will remove its quiz, questions and attempts.")) return;
    const res = await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("Delete failed"); return; }
    load();
  }

  function startEdit(m: Module) {
    setEditingId(m.id);
    setETitle(m.title);
    setEDescription(m.description || "");
    setEYouTubeId(m.youtubeId);
    setEOrder(m.order);
  }
  async function saveEdit() {
    if (!editingId) return;
    await update(editingId, { title: eTitle, description: eDescription, youtubeId: eYouTubeId, order: eOrder });
    setEditingId(null);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Modules</h1>
      {message && <p className="mb-3 text-sm rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2">{message}</p>}

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mb-4">
        <h3 className="font-semibold mb-2">Create Module</h3>
        <form onSubmit={create} className="grid gap-3 max-w-[520px]">
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="YouTube ID or URL" value={youtubeId} onChange={(e) => setYouTubeId(e.target.value)} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Order (optional)" value={order} onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
          </label>
          <button type="submit" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Create</button>
        </form>
      </section>

      <h3 className="font-semibold mb-2">All Modules</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Order</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Title</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">YouTube</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Published</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mods.map((m) => (
                <tr key={m.id}>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <input type="number" value={eOrder} onChange={(e) => setEOrder(Number(e.target.value))} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      m.order
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      m.title
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <input value={eYouTubeId} onChange={(e) => setEYouTubeId(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      m.youtubeId
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">{m.published ? "Yes" : "No"}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === m.id ? (
                      <div className="flex gap-2">
                        <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95" onClick={saveEdit}>Save</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => startEdit(m)}>Edit</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => update(m.id, { published: !m.published })}>{m.published ? "Unpublish" : "Publish"}</button>
                        <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(m.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

