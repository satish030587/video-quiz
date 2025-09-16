import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMainModuleProgress } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileForm from "./profile/profile-form";
import CertificatePanel from "@/components/CertificatePanel";
import UserSidebar from "./UserSidebar";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string; design?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin");

  const sp = await searchParams;
  const view = sp.view || "dashboard";
  const design = (sp as any).design === 'revamp' ? 'revamp' : 'classic';

  const groups = await getMainModuleProgress((session.user as any).id);
  const totalSubs = groups.reduce((s, g) => s + g.subModules.length, 0);
  const passedCount = groups.reduce((s, g) => s + g.subModules.filter((m) => m.status === "PASSED").length, 0);
  const allPassed = totalSubs > 0 && passedCount === totalSubs;
  
  // Find the current main module (first incomplete main module)
  const currentMainModule = groups.find(g => !g.completed);
  
  // Get the next sub-module from the current main module
  const nextSubModule = currentMainModule?.subModules.find(m => m.status === "PENDING");
  const attemptsLeft = nextSubModule ? Math.max(0, 2 - nextSubModule.attemptsUsed) : 0;
  
  // Get average score of the current main module (or overall if none)
  const currentAverage = currentMainModule?.dashboardAverage ?? null;
  
  // Get the most recent attempt date for the "Last Session" display
  const lastAttempt = await prisma.attempt.findFirst({
    where: { userId: (session.user as any).id },
    orderBy: { submittedAt: 'desc' }
  });
  
  const lastSessionDate = lastAttempt?.submittedAt 
    ? new Date(lastAttempt.submittedAt as any).toLocaleDateString() 
    : '—';

  let certificate: { eligible?: boolean; url?: string } = {};
  try {
    const res = await fetch(`/api/certificate`, { cache: "no-store" });
    if (res.ok) certificate = await res.json();
  } catch {}

  const ClassicInner = (
    <>
      <h1 className="text-2xl font-semibold mb-1 text-[color:var(--color-brand)]">Quiz Dashboard</h1>
      <p className="text-slate-700 mb-3">Welcome, {(session.user as any).name}. Progress: {passedCount}/{totalSubs} sub-modules passed.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="text-slate-600">Completion</div>
          <div className="text-2xl font-bold">{passedCount}/{totalSubs}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] h-full flex flex-col">
          <div className="text-slate-600">Current Module</div>
          <div className="text-2xl font-bold">{currentMainModule ? currentMainModule.title : "All complete"}</div>
          {currentMainModule && nextSubModule && (
            <div className="text-xs mt-2 text-slate-600">Next: <span className="font-semibold">{nextSubModule.title}</span></div>
          )}
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="text-slate-600">Attempts Left</div>
          <div className="text-2xl font-bold">{attemptsLeft}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="text-slate-600">Current Average</div>
          <div className="text-2xl font-bold">
            {currentMainModule?.dashboardAverage !== null ? `${currentMainModule?.dashboardAverage}%` : "—"}
          </div>
        </div>
      </div>

      {allPassed ? (
        <div className="my-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 p-3">
          <b>All modules complete.</b>{" "}
          {certificate.url ? <Link className="underline" href={certificate.url} target="_blank">Download your certificate</Link> : <Link className="underline" href="/?view=certificate">Go to certificate</Link>}
        </div>
      ) : null}

      <div className="grid gap-4">
        {groups.map((g) => {
          const total = g.subModules.length;
          const passed = g.subModules.filter((m) => m.status === 'PASSED').length;
          const percent = total ? Math.round((passed / total) * 100) : 0;
          const currentTitle = g.subModules.find((m) => m.status === 'PENDING')?.title || g.subModules.find((m) => m.status !== 'PASSED')?.title;
          return (
            <Link 
              href={`/main-module/${g.id}`}
              key={g.id} 
              className="block rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] relative md:hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <b>{g.orderIndex}:</b> <span className="font-medium">{g.title}</span>
                <span className={`ml-auto text-[11px] px-2 py-0.5 rounded border font-semibold ${g.completed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {g.completed ? 'COMPLETED' : 'IN PROGRESS'}
                </span>
              </div>
              {g.description && <p className="text-slate-700 mt-1">{g.description}</p>}
              <div className="mt-2 w-full h-2.5 rounded bg-slate-200 overflow-hidden" aria-label={`Progress ${percent}%`}>
                <div className="h-full bg-[color:var(--color-brand)]" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {/* Show button only on larger screens */}
                <span className="hidden md:inline-flex items-center gap-2 rounded border border-[color:var(--color-brand)] text-[color:var(--color-brand)] px-3 py-1.5 text-sm">
                  Open Main Module
                </span>
                <span className="text-slate-700 text-sm">Sub-modules: {passed}/{total} ({percent}%)</span>
                {currentTitle && <span className="text-slate-600 text-sm">Current: <b>{currentTitle}</b></span>}
              </div>
              {/* Mobile indicator arrow */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );

  // Revamped layout (toggle with ?design=revamp)
  const RevampInner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">Dashboard</h1>
        <Link href={`/?view=dashboard`} className="text-sm text-[color:var(--color-brand)] underline">Use classic layout</Link>
      </div>
      {/* Hero stats */}
      <section className="rounded-lg overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-[var(--shadow-card)]">
        <div className="p-5 grid md:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="10" className="text-[color:var(--color-brand)]" strokeDasharray={`${Math.max(0.001, (passedCount/(totalSubs||1))*2*Math.PI*38)} ${(2*Math.PI*38)}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{Math.round((passedCount/(totalSubs||1))*100)}%</div>
            </div>
            <div>
              <div className="text-xs opacity-80">Overall completion</div>
              <div className="text-lg font-semibold">{passedCount}/{totalSubs}</div>
            </div>
          </div>
          <div className="flex flex-col justify-between h-full">
            <div className="text-xs opacity-80">Current Module</div>
            <div className="text-lg font-semibold">{currentMainModule?.title || "All complete"}</div>
            {currentMainModule?.nextOpenSubModuleTitle && (
              <div className="text-xs opacity-80 mt-1">Next: <span className="font-semibold text-white">{currentMainModule.nextOpenSubModuleTitle}</span></div>
            )}
            {currentMainModule?.description && (
              <div className="text-xs opacity-80 mt-1 line-clamp-2">{currentMainModule.description}</div>
            )}
          </div>
          <div>
            <div className="text-xs opacity-80">Current Average</div>
            <div className="text-2xl font-semibold">
              {currentMainModule?.dashboardAverage !== null ? `${currentMainModule?.dashboardAverage}%` : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-80">Last Session</div>
            <div className="text-2xl font-semibold">{lastSessionDate}</div>
            {attemptsLeft > 0 && nextSubModule && (
              <div className="text-xs opacity-80">{attemptsLeft} attempts left</div>
            )}
          </div>
        </div>
      </section>

      {/* My Modules */}
      <section className="rounded border border-slate-200 bg-white mt-4 shadow-[var(--shadow-card)]">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">My Modules</h3>
            <p className="text-slate-500 text-sm">Track completion across your Main Modules</p>
          </div>
          <Link href={`/?view=dashboard&design=classic`} className="hidden md:inline text-sm text-[color:var(--color-brand)] underline">Use classic</Link>
        </div>
        <div className="border-t border-slate-100" />
        <div className="p-2">
          <div className="grid grid-cols-[1fr_160px_120px_120px] px-3 py-2 text-xs font-semibold text-slate-600">
            <div>Module</div>
            <div>Completion</div>
            <div>Average</div>
            <div>Action</div>
          </div>
          {groups.map((g) => {
            const total = g.subModules.length;
            const passed = g.subModules.filter((m) => m.status === 'PASSED').length;
            const percent = total ? Math.round((passed / total) * 100) : 0;
            
            // Get the current next sub-module if any
            const nextSubModule = g.nextOpenSubModuleTitle;
            
            return (
              <Link 
                href={`/main-module/${g.id}`} 
                key={g.id} 
                className={`grid grid-cols-[1fr_160px_120px_120px] items-center px-3 py-3 border-t border-slate-100 hover:bg-slate-50 relative md:hover:bg-slate-50 transition-colors ${!g.completed && currentMainModule?.id === g.id ? 'bg-slate-50' : ''}`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{g.orderIndex}. {g.title}</div>
                  {nextSubModule && !g.completed && currentMainModule?.id === g.id && (
                    <div className="text-slate-500 text-xs truncate">Next: {nextSubModule}</div>
                  )}
                </div>
                <div>
                  <div className="h-2.5 w-full rounded bg-slate-200 overflow-hidden">
                    <div className="h-full bg-[color:var(--color-brand)]" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">{passed}/{total} ({percent}%)</div>
                </div>
                <div className="text-sm text-slate-700">
                  {g.dashboardAverage !== null ? `${g.dashboardAverage}%` : '—'}
                </div>
                <div className="hidden md:block">
                  <span className="inline-flex items-center rounded border border-[color:var(--color-brand)] text-[color:var(--color-brand)] px-3 py-1.5 text-sm">Open</span>
                </div>
                {/* Mobile indicator arrow */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
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
  const DashboardInner = design === 'revamp' ? RevampInner : ClassicInner;
  const inner = view === "dashboard" ? (design === 'revamp' ? RevampInner : ClassicInner) : view === "profile" ? ProfileInner : CertificateInner;

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
