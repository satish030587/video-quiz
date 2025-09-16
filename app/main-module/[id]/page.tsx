import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMainModuleProgress } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MainModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const main = await (prisma as any).mainModule.findUnique({ where: { id: Number(id) } });
  if (!main) redirect("/");
  const tree = await getMainModuleProgress((session.user as any).id);
  const group = tree.find((g) => g.id === Number(id));
  const subs = group?.subModules || [];
  return (
    <main>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">← Back</Link>
        <h1 className="text-2xl font-semibold text-[color:var(--color-brand)]">{main.title}</h1>
      </div>
      {main.description && <p className="text-slate-700 mb-3">{main.description}</p>}
      <div className="rounded border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)] mb-4">
        <div className="aspect-video w-full bg-black">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${main.youtubeId}`} title="Main Module Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </div>
      <h3 className="font-semibold mb-2">Sub-modules</h3>
      <div className="grid gap-3">
        {subs.map((m) => (
          m.status === "PENDING" ? (
            <Link 
              href={`/module/${m.id}`} 
              key={m.id} 
              className="block rounded border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)] relative md:hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <b>{m.title}</b>
                <span className="ml-auto text-xs px-2 py-0.5 rounded border border-slate-300">{m.status}</span>
              </div>
              {m.description && <p className="text-slate-700 mt-1">{m.description}</p>}
              <div className="mt-2">
                {/* Show button only on larger screens */}
                <span className="hidden md:inline-block rounded bg-[color:var(--color-brand)] !text-white px-3 py-1.5 text-sm">Open</span>
              </div>
              {/* Mobile indicator arrow */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </Link>
          ) : (
            <div key={m.id} className="rounded border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <b>{m.title}</b>
                <span className="ml-auto text-xs px-2 py-0.5 rounded border border-slate-300">{m.status}</span>
              </div>
              {m.description && <p className="text-slate-700 mt-1">{m.description}</p>}
              <div className="mt-2">
                <button className="rounded bg-slate-200 text-slate-600 px-3 py-1.5 text-sm cursor-not-allowed" disabled>
                  {m.status === "PASSED" ? "Passed" : m.status === "FAILED" ? "Failed" : "Locked"}
                </button>
              </div>
            </div>
          )
        ))}
        {subs.length === 0 && <div className="text-slate-600">No sub-modules assigned.</div>}
      </div>
    </main>
  );
}
