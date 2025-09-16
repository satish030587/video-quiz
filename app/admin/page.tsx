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

  const [users, modules, attempts, mainModules, assignedSubs] = await Promise.all([
    prisma.user.count(),
    prisma.module.count(),
    prisma.attempt.findMany({ select: { passed: true, quizId: true } }) as Promise<Array<{ passed: boolean; quizId: string }>>,
    (prisma as any).mainModule.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.module.count({ where: { NOT: { mainModuleId: null as any } } as any }),
  ]);
  const passed = attempts.filter((a: { passed: boolean }) => a.passed).length;
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
              <div className="text-slate-600">Sub-modules (Modules)</div>
              <div className="text-3xl font-bold">{modules}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Completion Rate</div>
              <div className="text-3xl font-bold">{completionRate}%</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Main Modules</div>
              <div className="text-3xl font-bold">{mainModules.length}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Assigned Sub-modules</div>
              <div className="text-3xl font-bold">{assignedSubs}</div>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-slate-600">Unassigned Sub-modules</div>
              <div className="text-3xl font-bold">{Math.max(0, modules - assignedSubs)}</div>
            </div>
          </div>
          {/* Module pass rates removed per request */}
          <h3 className="font-semibold mt-6 mb-2">Main Modules overview</h3>
          <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-[var(--shadow-card)]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Main Module</th>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Sub-modules</th>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Attempts</th>
                  <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Pass rate</th>
                </tr>
              </thead>
              <tbody>
                {await (async () => {
                  // Build per-main-module pass rates
                  const rows: Array<{ id: number; name: string; subs: number; attempts: number; rate: string }> = [];
                  for (const mm of mainModules as Array<{ id: number; orderIndex: number; title: string }>) {
                    const subs = await prisma.module.findMany({ where: { mainModuleId: mm.id } as any, include: { quiz: true } });
                    const quizIds = subs.filter((m: any) => m.quiz).map((m: any) => m.quiz.id as string);
                    let attemptsCount = 0, passCount = 0;
                    if (quizIds.length) {
                      const atts = await prisma.attempt.findMany({ where: { quizId: { in: quizIds } }, select: { passed: true } });
                      attemptsCount = atts.length;
                      passCount = atts.filter(a => a.passed).length;
                    }
                    const rate = attemptsCount ? `${Math.round((passCount / attemptsCount) * 100)}%` : "0%";
                    rows.push({ id: mm.id, name: `${mm.orderIndex}. ${mm.title}`, subs: subs.length, attempts: attemptsCount, rate });
                  }
                  return rows.map((r, i) => (
                    <tr key={i} className="relative hover:bg-slate-50 cursor-pointer">
                      {/* Full-row clickable overlay */}
                      <td className="px-2 py-2 border-b border-slate-100">
                        <a href={`/admin/main-modules/${rows[i].id}/progress`} className="absolute inset-0" aria-label={`Open ${r.name}`}></a>
                        {r.name}
                      </td>
                      <td className="px-2 py-2 border-b border-slate-100">{r.subs}</td>
                      <td className="px-2 py-2 border-b border-slate-100">{r.attempts}</td>
                      <td className="px-2 py-2 border-b border-slate-100">{r.rate}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view !== "dashboard" && <PanelSwitcher view={view} />}
    </main>
  );
}
