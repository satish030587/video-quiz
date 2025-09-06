import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PanelSwitcher from "./PanelSwitcher";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  const sp = await searchParams;
  const view = sp.view || "dashboard";

  const [users, modules, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.module.count(),
    prisma.attempt.findMany({ select: { passed: true, quizId: true } }),
  ]);
  const passed = attempts.filter((a) => a.passed).length;
  const completionRate = attempts.length ? Math.round((passed / attempts.length) * 100) : 0;

  // Simple per-module pass counts
  const quizPassCounts = new Map<string, { pass: number; total: number }>();
  for (const a of attempts) {
    const s = quizPassCounts.get(a.quizId) || { pass: 0, total: 0 };
    s.total += 1;
    if (a.passed) s.pass += 1;
    quizPassCounts.set(a.quizId, s);
  }
  const quizRows: { module: string; passRate: string }[] = [];
  const quizzes = await prisma.quiz.findMany({ include: { module: true } });
  for (const q of quizzes) {
    const s = quizPassCounts.get(q.id) || { pass: 0, total: 0 };
    const rate = s.total ? Math.round((s.pass / s.total) * 100) : 0;
    quizRows.push({ module: `${q.module.order}. ${q.module.title}`, passRate: `${rate}%` });
  }

  return (
    <main>
      {view === "dashboard" && (
        <section>
          <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Admin Dashboard</h1>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Users</div>
              <div className="text-3xl font-bold">{users}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Modules</div>
              <div className="text-3xl font-bold">{modules}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Completion Rate</div>
              <div className="text-3xl font-bold">{completionRate}%</div>
            </div>
          </div>
          <h3 className="font-semibold mt-6 mb-2">Module pass rates</h3>
          <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Module</th>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Pass rate</th>
                </tr>
              </thead>
              <tbody>
                {quizRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2 border-b border-slate-100">{r.module}</td>
                    <td className="px-2 py-2 border-b border-slate-100">{r.passRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view !== "dashboard" && <PanelSwitcher view={view} />}
    </main>
  );
}
