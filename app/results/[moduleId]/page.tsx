import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Results({ params, searchParams }: { params: Promise<{ moduleId: string }>, searchParams: Promise<{ score?: string, passed?: string, tq?: string, ta?: string, tc?: string, tw?: string, req?: string, rem?: string, an?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { moduleId } = await params;
  const sp = await searchParams;
  const score = Number(sp.score ?? 0);
  const passed = sp.passed === "1";
  const totalQuestions = Number(sp.tq ?? 0);
  const totalAnswered = Number(sp.ta ?? 0);
  const totalCorrect = Number(sp.tc ?? 0);
  const totalWrong = Number(sp.tw ?? Math.max(0, totalAnswered - totalCorrect));
  const passScore = Number(sp.req ?? 0);
  const attemptsRemaining = Number(sp.rem ?? 0);
  const attemptNo = Number(sp.an ?? 0);

  // Fetch module title/order
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { title: true, order: true } });

  function ScoreRing({ score }: { score: number }) {
    const pct = Math.max(0, Math.min(100, score)) / 100;
    const R = 40;
    const C = 2 * Math.PI * R;
    const dash = Math.max(0.001, pct) * C;
    const gap = C - dash;
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-[color:var(--color-brand)]" strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-xl font-bold text-slate-800">{score}%</div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <section className="mx-auto max-w-[980px]">
        <h1 className="text-2xl font-semibold mb-1 text-[color:var(--color-brand)]">
          Result · {mod?.order ? `Module ${mod.order}: ` : ""}{mod?.title || "Module"}
        </h1>
        <p className="text-slate-600 mb-3">Your score summary and details</p>
        <div className="rounded border border-slate-200 bg-white shadow-[var(--shadow-card)] p-5 md:p-6">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
            {/* Right on desktop, top on mobile */}
            <div className="flex md:block justify-center order-first md:order-none">
              <ScoreRing score={score} />
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${passed ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                  {passed ? "Passed" : "Failed"}
                </span>
                <span className="text-slate-600 text-sm">Required ≥ {passScore}%</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-slate-600">Total Questions</div>
                  <div className="text-xl font-semibold">{totalQuestions}</div>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-slate-600">Attempt #</div>
                  <div className="text-xl font-semibold">{attemptNo}</div>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-slate-600">Answered</div>
                  <div className="text-xl font-semibold">{totalAnswered}</div>
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <div className="text-slate-600">Correct / Wrong</div>
                  <div className="text-xl font-semibold">{totalCorrect} / {totalWrong}</div>
                </div>
              </div>

              <div className="mt-1">
                {passed ? (
                  <p className="text-emerald-700">Congratulations! You have passed.</p>
                ) : attemptsRemaining > 0 ? (
                  <p className="text-slate-700">Better luck next time. You have {attemptsRemaining} attempt(s) remaining.</p>
                ) : (
                  <p className="text-slate-700">Sorry, no attempts remaining. Contact your admin.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link href="/"><button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Back to Dashboard</button></Link>
                {!passed && attemptsRemaining > 0 && (
                  <Link href={`/module/${moduleId}`}>
                    <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95">Retry / Rewatch</button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

