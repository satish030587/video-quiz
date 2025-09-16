import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MainModuleProgress({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/");
  const { id } = await params;
  const mm = await (prisma as any).mainModule.findUnique({ where: { id: Number(id) } });
  if (!mm) redirect("/admin");
  const subs = await prisma.module.findMany({ where: { mainModuleId: Number(id) } as any, orderBy: { orderWithinMain: "asc" as any }, include: { quiz: true } });

  // Compute attempts and pass rate per sub-module
  const rows: Array<{ order: number; title: string; attempts: number; passRate: string }> = [];
  for (const m of subs as any[]) {
    let attempts = 0, passed = 0;
    if (m.quiz) {
      const atts = await prisma.attempt.findMany({ where: { quizId: m.quiz.id }, select: { passed: true } });
      attempts = atts.length; passed = atts.filter(a => a.passed).length;
    }
    const rate = attempts ? `${Math.round((passed / attempts) * 100)}%` : "0%";
    rows.push({ order: m.orderWithinMain ?? 0, title: m.title, attempts, passRate: rate });
  }

  return (
    <main>
      <div className="flex items-center gap-3 mb-3">
        <Link href="/admin" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">← Back</Link>
        <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Main Module: {mm.title}</h1>
      </div>
      <div className="rounded border border-slate-200 bg-white shadow-[var(--shadow-card)] overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">#</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Sub-module</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Attempts</th>
              <th className="text-left border-b border-slate-200 px-2 py-2 text-sm font-semibold">Pass rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-2 py-2 border-b border-slate-100 w-14">{r.order || i + 1}</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.title}</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.attempts}</td>
                <td className="px-2 py-2 border-b border-slate-100">{r.passRate}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-2 py-4 text-slate-600" colSpan={4}>No sub-modules assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
