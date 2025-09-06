import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModuleProgress } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileForm from "./profile/profile-form";
import CertificatePanel from "@/components/CertificatePanel";
import UserSidebar from "./UserSidebar";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin");

  const sp = await searchParams;
  const view = sp.view || "dashboard";

  const progress = await getModuleProgress((session.user as any).id);
  const passedCount = progress.filter((p) => p.status === "PASSED").length;
  const allPassed = passedCount === progress.length && progress.length > 0;
  const current = progress.find((p) => p.status === "PENDING") || progress.find((p) => p.status !== "PASSED");
  const attemptsLeft = current && current.status === "PENDING" ? Math.max(0, 2 - current.attemptsUsed) : 0;

  const attempts = await prisma.attempt.findMany({ where: { userId: (session.user as any).id } });
  const bestByQuiz = new Map<string, number>();
  for (const a of attempts) bestByQuiz.set(a.quizId, Math.max(bestByQuiz.get(a.quizId) ?? 0, a.score));
  const bestScores = Array.from(bestByQuiz.values());
  const averageScore = bestScores.length ? Math.round(bestScores.reduce((s, v) => s + v, 0) / bestScores.length) : 0;

  let certificate: { eligible?: boolean; url?: string } = {};
  try {
    const res = await fetch(`/api/certificate`, { cache: "no-store" });
    if (res.ok) certificate = await res.json();
  } catch {}

  const DashboardInner = (
    <>
      <h1 className="text-2xl font-semibold mb-1 text-[color:var(--color-brand)]">Quiz Dashboard</h1>
      <p className="text-slate-700 mb-3">Welcome, {(session.user as any).name}. Progress: {passedCount}/{progress.length} modules passed.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]"><div className="text-slate-600">Completion</div><div className="text-2xl font-bold">{passedCount}/{progress.length}</div></div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]"><div className="text-slate-600">Current Module</div><div className="text-2xl font-bold">{current ? `${current.order}. ${current.title}` : (allPassed ? "All complete" : "—")}</div></div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]"><div className="text-slate-600">Attempts Left</div><div className="text-2xl font-bold">{attemptsLeft}</div></div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]"><div className="text-slate-600">Average Score</div><div className="text-2xl font-bold">{averageScore}%</div></div>
      </div>

      {allPassed ? (
        <div className="my-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 p-3">
          <b>All modules complete.</b>{" "}
          {certificate.url ? <Link className="underline" href={certificate.url} target="_blank">Download your certificate</Link> : <Link className="underline" href="/?view=certificate">Go to certificate</Link>}
        </div>
      ) : null}

      <div className="grid gap-3">
        {progress.map((m) => (
          <div key={m.id} className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <b>Module {m.order}:</b> <span>{m.title}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded border border-slate-300">
                {m.status} {m.lastScore != null ? `(last ${m.lastScore}%)` : ""}
              </span>
            </div>
            <p className="text-slate-700 mt-1">{m.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(() => {
                const isLocked = m.status === "LOCKED";
                const isFailedOut = m.status === "FAILED";
                const isPassed = m.status === "PASSED";
                const showRetry = m.status === "PENDING" && m.attemptsUsed >= 1;
                const label = isPassed ? "Completed" : showRetry ? "Retry" : "Open";
                if (isPassed) {
                  return (
                    <button className="rounded bg-slate-200 text-slate-600 px-3 py-1.5 text-sm cursor-not-allowed" disabled>
                      {label}
                    </button>
                  );
                }
                return (
                  <Link href={`/module/${m.id}`}>
                    <button
                      className="rounded bg-[color:var(--color-brand)] text-white px-3 py-1.5 text-sm hover:opacity-95 disabled:opacity-50"
                      disabled={isLocked || isFailedOut}
                    >
                      {label}
                    </button>
                  </Link>
                );
              })()}
              {m.status === "PASSED" && <span className="text-emerald-700">Passed ✓</span>}
              {m.status === "FAILED" && <span className="text-red-700">Failed (2/2)</span>}
              {m.status === "PENDING" && <span className="text-slate-600 text-sm">Attempts used: {m.attemptsUsed}/2 · Pass ≥ {m.passScore}%</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const ProfileInner = (
    <section>
      <h2 className="text-xl font-semibold mb-2 text-[color:var(--color-brand)]">Profile</h2>
      <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] max-w-[520px]">
        <ProfileForm />
      </div>
    </section>
  );

  const CertificateInner = (
    <section>
      <h2 className="text-xl font-semibold mb-2 text-[color:var(--color-brand)]">Certificate</h2>
      <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] max-w-[720px]">
        <CertificatePanel />
      </div>
    </section>
  );

  const isHomeView = ["dashboard", "profile", "certificate"].includes(view);
  const inner = view === "dashboard" ? DashboardInner : view === "profile" ? ProfileInner : CertificateInner;

  return (
    <main>
      {isHomeView ? (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)] gap-3 md:gap-0">
          <aside className="md:border-r border-b md:border-b-0 px-3 py-3 bg-white">
            <UserSidebar />
          </aside>
          <section className="p-1 md:p-4">{inner}</section>
        </div>
      ) : (
        <section>{DashboardInner}</section>
      )}
    </main>
  );
}

