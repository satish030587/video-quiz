import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // Ensure every module has a quiz (covers records added via Prisma Studio)
  let modulesWithQuiz = await prisma.module.findMany({ orderBy: { order: "asc" }, include: { quiz: true } });
  // Normalize YouTube IDs if stored as full URLs via Prisma Studio
  for (const m of modulesWithQuiz) {
    const id = extractYouTubeId(m.youtubeId);
    if (id !== m.youtubeId) {
      await prisma.module.update({ where: { id: m.id }, data: { youtubeId: id } });
    }
  }
  modulesWithQuiz = await prisma.module.findMany({ orderBy: { order: "asc" }, include: { quiz: true } });
  // Self-heal ordering if there are gaps/duplicates
  let needsReindex = false;
  for (let i = 0; i < modulesWithQuiz.length; i++) {
    if (modulesWithQuiz[i].order !== i + 1) { needsReindex = true; break; }
  }
  if (needsReindex) {
    for (let i = 0; i < modulesWithQuiz.length; i++) {
      const m = modulesWithQuiz[i];
      if (m.order !== i + 1) await prisma.module.update({ where: { id: m.id }, data: { order: i + 1 } });
    }
    modulesWithQuiz = await prisma.module.findMany({ orderBy: { order: "asc" }, include: { quiz: true } });
  }
  const missing = modulesWithQuiz.filter((m) => !m.quiz);
  for (const m of missing) {
    await prisma.quiz.upsert({ where: { moduleId: m.id }, create: { moduleId: m.id, passScore: 70, timeLimitSeconds: 300 }, update: {} });
  }
  const modules = modulesWithQuiz.map(({ quiz, ...rest }) => rest);
  return NextResponse.json({ modules });
}

const bodySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  youtubeId: z.string().min(3),
  order: z.number().int().positive().optional(),
  published: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { title, description, youtubeId, order, published } = parsed.data;
  const yt = extractYouTubeId(youtubeId);
  // Determine position; if inserting at a specific order, shift others down
  let finalOrder = order;
  if (!finalOrder) {
    const max = await prisma.module.aggregate({ _max: { order: true } });
    finalOrder = (max._max.order ?? 0) + 1;
  } else {
    await prisma.module.updateMany({ where: { order: { gte: finalOrder } }, data: { order: { increment: 1 } } });
  }
  const mod = await prisma.module.create({ data: { title, description: description || null, youtubeId: yt, order: finalOrder, published } });
  // Ensure a quiz exists
  await prisma.quiz.upsert({ where: { moduleId: mod.id }, create: { moduleId: mod.id, passScore: 70, timeLimitSeconds: 300 }, update: {} });
  return NextResponse.json({ module: mod }, { status: 201 });
}
