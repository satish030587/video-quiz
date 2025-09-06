import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isModuleAccessible } from "@/lib/quiz";
import VideoGate from "@/components/VideoGate";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id: moduleId } = await params;
  const ok = await isModuleAccessible((session.user as any).id, moduleId);
  if (!ok) redirect("/");
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, include: { quiz: true } });
  if (!mod) redirect("/");
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-2 text-[color:var(--color-brand)]">Module {mod.order}: {mod.title}</h1>
      <p className="text-slate-700 mb-3">{mod.description}</p>
      <div className="rounded border border-slate-200 bg-white p-3 shadow-[var(--shadow-card)]">
        <Suspense fallback={<div>Loading player…</div>}>
          <VideoGate videoId={mod.youtubeId} moduleId={mod.id} />
        </Suspense>
      </div>
    </main>
  );
}

