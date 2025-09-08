import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function allModulesPassed(userId: string) {
  type ModuleWithQuiz = { quiz: { id: string } | null };
  const modules: ModuleWithQuiz[] = await prisma.module.findMany({ include: { quiz: true }, orderBy: { order: "asc" } });
  if (modules.length === 0) return false;
  const attempts: Array<{ passed: boolean; quizId: string }> = await prisma.attempt.findMany({ where: { userId }, select: { passed: true, quizId: true } });
  const passedQuizIds = new Set(attempts.filter((a) => a.passed).map((a) => a.quizId));
  return modules.every((m: ModuleWithQuiz) => m.quiz && passedQuizIds.has(m.quiz.id));
}

async function computeOverallScore(userId: string) {
  const modules = await prisma.module.findMany({ include: { quiz: true }, orderBy: { order: "asc" } });
  if (modules.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const m of modules) {
    if (!m.quiz) continue;
    const best = await prisma.attempt.findFirst({ where: { userId, quizId: m.quiz.id }, orderBy: { score: "desc" } });
    if (best) { sum += best.score; count++; }
  }
  return count ? Math.round(sum / count) : 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const eligible = await allModulesPassed(session.user.id);
  const existing = await prisma.certificate.findUnique({ where: { userId: session.user.id } });
  // Only provide a URL if the user is currently eligible
  const url = existing && eligible ? `/api/certificate/download` : undefined;
  return NextResponse.json({ eligible, url });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const eligible = await allModulesPassed(session.user.id);
  if (!eligible) return NextResponse.json({ message: "Not eligible" }, { status: 400 });
  const overallScore = await computeOverallScore(session.user.id);
  const filePath = await generateCertificatePdf({ userName: session.user.name || "User", userEmail: session.user.email || session.user.id, overallScore });
  const record = await prisma.certificate.upsert({
    where: { userId: session.user.id },
    update: { filePath, totalScore: overallScore },
    create: { userId: session.user.id, filePath, totalScore: overallScore },
  });
  // Serve via authenticated download endpoint
  const url = `/api/certificate/download`;
  return NextResponse.json({ url });
}

