import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import path from "path";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ userId: z.string() });

async function allModulesPassed(userId: string) {
  const modules = await prisma.module.findMany({ include: { quiz: true } });
  if (modules.length === 0) return false;
  const attempts = await prisma.attempt.findMany({ where: { userId } });
  const passedQuizIds = new Set(attempts.filter((a) => a.passed).map((a) => a.quizId));
  return modules.every((m) => m.quiz && passedQuizIds.has(m.quiz.id));
}

async function computeOverallScore(userId: string) {
  const modules = await prisma.module.findMany({ include: { quiz: true } });
  if (modules.length === 0) return 0;
  let sum = 0, count = 0;
  for (const m of modules) {
    if (!m.quiz) continue;
    const best = await prisma.attempt.findFirst({ where: { userId, quizId: m.quiz.id }, orderBy: { score: "desc" } });
    if (best) { sum += best.score; count++; }
  }
  return count ? Math.round(sum / count) : 0;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { userId } = parsed.data;
  const ok = await allModulesPassed(userId);
  if (!ok) return NextResponse.json({ message: "User not eligible" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  const score = await computeOverallScore(userId);
  const filePath = await generateCertificatePdf({ userName: user.name, userEmail: user.email, overallScore: score });
  const record = await prisma.certificate.upsert({ where: { userId }, update: { filePath, totalScore: score }, create: { userId, filePath, totalScore: score } });
  const url = `/certificates/${path.basename(record.filePath)}`;
  return NextResponse.json({ url });
}

