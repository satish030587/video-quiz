import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import { getMainModuleProgress } from "@/lib/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function allModulesPassed(userId: string) {
  // Check if there are any main modules
  const mainModules = await prisma.$queryRaw`SELECT * FROM "MainModule"`.catch(() => []);
  if (mainModules && (mainModules as any[]).length > 0) {
    // If main modules exist, check if all of them are completed
    const mainModuleProgress = await getMainModuleProgress(userId);
    return mainModuleProgress.every((m) => m.completed);
  } else {
    // Legacy behavior: check if all individual modules are passed
    type ModuleWithQuiz = { quiz: { id: string } | null };
    const modules: ModuleWithQuiz[] = await prisma.module.findMany({ include: { quiz: true }, orderBy: { order: "asc" } });
    if (modules.length === 0) return false;
    const attempts: Array<{ passed: boolean; quizId: string }> = await prisma.attempt.findMany({ where: { userId }, select: { passed: true, quizId: true } });
    const passedQuizIds = new Set(attempts.filter((a) => a.passed).map((a) => a.quizId));
    return modules.every((m: ModuleWithQuiz) => m.quiz && passedQuizIds.has(m.quiz.id));
  }
}

async function computeOverallScore(userId: string) {
  // Average across all main modules
  const mainModuleProgress = await getMainModuleProgress(userId);
  if (mainModuleProgress.length > 0) {
    // Calculate the overall average from all main module averages
    const totalScore = mainModuleProgress.reduce((sum, module) => sum + module.averageForCertificate, 0);
    return Math.round(totalScore / mainModuleProgress.length);
  }
  
  // Fallback: average across all modules if no main modules
  const modules = await prisma.module.findMany({ include: { quiz: true } });
  let sum = 0, count = 0;
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
  
  // Check for existing certificate
  const existing = await prisma.$queryRaw`
    SELECT * FROM "Certificate" 
    WHERE "userId" = ${session.user.id} AND "mainModuleId" IS NULL
  `.then(results => (results as any[])[0] || null).catch(() => null);
  
  // Only provide a URL if the user is currently eligible
  const url = existing && eligible ? `/api/certificate/download` : undefined;
  return NextResponse.json({ eligible, url });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  
  const eligible = await allModulesPassed(session.user.id);
  if (!eligible) return NextResponse.json({ message: "Not eligible - all main modules must be completed" }, { status: 400 });
  
  const overallScore = await computeOverallScore(session.user.id);
  const filePath = await generateCertificatePdf({ 
    userName: session.user.name || "User", 
    userEmail: session.user.email || session.user.id, 
    overallScore, 
    contextTitle: "All Main Modules Completed" 
  });
  
  // Update or create certificate record
  await prisma.$executeRaw`
    INSERT INTO "Certificate" ("id", "userId", "mainModuleId", "issuedAt", "totalScore", "filePath")
    VALUES (${crypto.randomUUID()}, ${session.user.id}, NULL, ${new Date()}, ${overallScore}, ${filePath})
    ON CONFLICT ("userId", "mainModuleId") 
    DO UPDATE SET "filePath" = ${filePath}, "totalScore" = ${overallScore}, "issuedAt" = ${new Date()}
  `;
  
  // Serve via authenticated download endpoint
  const url = `/api/certificate/download`;
  return NextResponse.json({ url });
}

