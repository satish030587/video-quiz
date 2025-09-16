import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ userId: z.string(), moduleId: z.string().optional(), mainModuleId: z.number().optional(), all: z.boolean().optional() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { userId, moduleId, mainModuleId, all } = parsed.data as { userId: string; moduleId?: string; mainModuleId?: number; all?: boolean };
  if (all) {
    await prisma.attempt.deleteMany({ where: { userId } });
  } else if (mainModuleId != null) {
    const subs = await prisma.module.findMany({ where: { mainModuleId } as any, include: { quiz: true } });
    const quizIds = subs.filter((m) => m.quiz).map((m) => (m.quiz as any).id as string);
    if (quizIds.length) await prisma.attempt.deleteMany({ where: { userId, quizId: { in: quizIds } } });
  } else if (moduleId) {
    const quiz = await prisma.quiz.findUnique({ where: { moduleId } });
    if (!quiz) return NextResponse.json({ message: "Quiz not found for module" }, { status: 404 });
    await prisma.attempt.deleteMany({ where: { userId, quizId: quiz.id } });
  } else {
    return NextResponse.json({ message: "Provide moduleId, mainModuleId or all" }, { status: 400 });
  }
  // Invalidate any existing certificate for this user (global certificate only here)
  try {
    const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
    if (cert) {
      await (prisma as any).certificate.delete({ where: { userId_mainModuleId: { userId, mainModuleId: null } } });
      if (cert.filePath && fs.existsSync(cert.filePath)) {
        fs.unlink(cert.filePath, () => {});
      }
    }
  } catch {}
  return NextResponse.json({ ok: true });
}

