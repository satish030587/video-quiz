"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ProfileForm() {
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      setName(data.name || "");
      setEmail(data.email || "");
      setAddress(data.address || "");
      setPhone(data.phone || "");
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, address, phone }) });
    if (!res.ok) { setMessage("Failed to save"); return; }
    try { await update?.({ name, email }); } catch {}
    setMessage("Saved");
  }

  if (loading) return <div>Loading…</div>;
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      {message && (
        <p className={message === "Saved" ? "text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-3 py-2 text-sm" : "text-red-800 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm"}>{message}</p>
      )}
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Name</span>
        <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Email</span>
        <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Address</span>
        <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Mobile Number</span>
        <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95" type="submit">Save</button>
    </form>
  );
}

