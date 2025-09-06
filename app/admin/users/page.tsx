"use client";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string; role: string; disabledAt?: string | null; address?: string; phone?: string };
type Module = { id: string; order: number; title: string };

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [moduleId, setModuleId] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [moduleQuery, setModuleQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("EMPLOYEE");
  const [editPassword, setEditPassword] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");

  async function load() {
    setLoading(true);
    const [userRes, modRes] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/modules", { cache: "no-store" }),
    ]);
    const usersData = await userRes.json();
    const modulesData = await modRes.json();
    setUsers(usersData.users);
    setModules(modulesData.modules.map((m: any) => ({ id: m.id, order: m.order, title: m.title })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, password, role }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Failed to add user"); return; }
    setEmail(""); setName(""); setPassword(""); setRole("EMPLOYEE");
    load();
  }

  // Invite flow
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  async function inviteUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch("/api/admin/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail, name: inviteName }) });
      if (!res.ok) throw new Error("Invite failed");
      setInviteEmail(""); setInviteName("");
      setMessage("Invite sent (check email or server logs in dev)");
    } catch (e: any) {
      setMessage(e?.message || "Invite failed");
    }
  }

  async function toggle(id: string, disabled: boolean) {
    setMessage(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disabled }) });
    if (!res.ok) { setMessage("Failed to update user"); return; }
    load();
  }

  async function resetAttempts(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch(`/api/admin/users/reset-attempts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: resetUserId, moduleId }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Failed to reset attempts"); return; }
    setMessage("Attempts reset");
  }

  function labelForUser(u: User) { return `${u.name} (${u.email})`; }
  function labelForModule(m: Module) { return `${m.order}. ${m.title}`; }

  function onPickUser(input: string) {
    setUserQuery(input);
    const match = users.find((u) => labelForUser(u).toLowerCase() === input.toLowerCase());
    setResetUserId(match ? match.id : "");
  }
  function onPickModule(input: string) {
    setModuleQuery(input);
    const match = modules.find((m) => labelForModule(m).toLowerCase() === input.toLowerCase());
    setModuleId(match ? match.id : "");
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword("");
    setEditAddress(u.address || "");
    setEditPhone(u.phone || "");
  }
  async function saveEdit() {
    if (!editingId) return;
    const body: any = { name: editName, email: editEmail, role: editRole, address: editAddress, phone: editPhone };
    if (editPassword) body.password = editPassword;
    const res = await fetch(`/api/admin/users/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setMessage("Failed to save user"); return; }
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    setMessage(null);
    if (!confirm("Delete this user? This will remove their attempts and certificate.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMessage(data.message || "Delete failed"); return; }
    load();
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Users</h1>
      {message && <p className="mb-3 text-sm rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2">{message}</p>}

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mb-4">
        <h3 className="font-semibold mb-2">Add User</h3>
        <form onSubmit={addUser} className="grid gap-3 max-w-[480px]">
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Temp Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Add</button>
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mb-4">
        <h3 className="font-semibold mb-2">Invite User</h3>
        <form onSubmit={inviteUser} className="grid gap-3 max-w-[480px]">
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Email" value={inviteEmail} onChange={(e)=>setInviteEmail(e.target.value)} required />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="Name" value={inviteName} onChange={(e)=>setInviteName(e.target.value)} />
          <button type="submit" className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95">Send Invite</button>
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] mb-4">
        <h3 className="font-semibold mb-2">Reset Attempts</h3>
        <form onSubmit={resetAttempts} className="grid gap-3 max-w-[720px]">
          <div>
            <label className="mr-2">Employee:</label>
            <input className="rounded border border-slate-300 px-3 py-2 text-sm" list="user-options" placeholder="Search by name or email" value={userQuery} onChange={(e) => onPickUser(e.target.value)} />
            <datalist id="user-options">
              {users.map((u) => (
                <option key={u.id} value={labelForUser(u)} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mr-2">Module:</label>
            <input className="rounded border border-slate-300 px-3 py-2 text-sm" list="module-options" placeholder="Search by title" value={moduleQuery} onChange={(e) => onPickModule(e.target.value)} />
            <datalist id="module-options">
              {modules.map((m) => (
                <option key={m.id} value={labelForModule(m)} />
              ))}
            </datalist>
          </div>
          <div className="text-slate-500 text-xs">Selected IDs: user {resetUserId || '—'} · module {moduleId || '—'}</div>
          <button type="submit" disabled={!resetUserId || !moduleId} className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm disabled:opacity-50">Reset</button>
        </form>
      </section>

      <h3 className="font-semibold mb-2">All Users</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Email</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Name</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Address</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Mobile</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Role</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Status</th>
                <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    ) : (
                      u.email
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    ) : (
                      u.address || "—"
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                    ) : (
                      u.phone || "—"
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <select className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="px-2 py-2 border-b border-slate-100">{u.disabledAt ? "Disabled" : "Active"}</td>
                  <td className="px-2 py-2 border-b border-slate-100">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <input className="rounded border border-slate-300 px-2 py-1 text-sm" placeholder="New password (optional)" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                        <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95" onClick={saveEdit}>Save</button>
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => startEdit(u)}>Edit</button>
                        {u.disabledAt ? (
                          <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => toggle(u.id, false)}>Enable</button>
                        ) : (
                          <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50" onClick={() => toggle(u.id, true)}>Disable</button>
                        )}
                        <button className="rounded bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-500" onClick={() => remove(u.id)}>Delete</button>
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

