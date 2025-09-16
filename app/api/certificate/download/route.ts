import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function allModulesPassed(userId: string) {
  const modules = await prisma.module.findMany({ include: { quiz: true }, orderBy: { order: "asc" } });
  if (!modules.length) return false;
  const attempts = await prisma.attempt.findMany({ where: { userId }, select: { quizId: true, passed: true } });
  const passed = new Set(attempts.filter(a => a.passed).map(a => a.quizId));
  return modules.every(m => m.quiz && passed.has(m.quiz.id));
}

async function ensureFileForUser(userId: string) {
  // Require current eligibility
  const eligible = await allModulesPassed(userId);
  if (!eligible) return null;
  const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
  if (cert && fs.existsSync(cert.filePath)) return cert.filePath;
  // (Re)generate if eligible but missing
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  // Compute average across Main Modules if present; else across all modules
  const mains = await (prisma as any).mainModule.findMany({});
  let overallScore = 0;
  if (mains && mains.length) {
    let total = 0, groups = 0;
    for (const mm of mains as Array<{ id: number }>) {
      const subs = await prisma.module.findMany({ where: { mainModuleId: mm.id } as any, include: { quiz: true } });
      let sum = 0, count = 0;
      for (const m of subs) {
        if (!m.quiz) continue;
        const best = await prisma.attempt.findFirst({ where: { userId, quizId: m.quiz.id }, orderBy: { score: "desc" } });
        if (best) { sum += best.score; count++; }
      }
      if (count) { total += Math.round(sum / count); groups++; }
    }
    overallScore = groups ? Math.round(total / groups) : 0;
  } else {
    const modules = await prisma.module.findMany({ include: { quiz: true } });
    let sum = 0, count = 0;
    for (const m of modules) {
      if (!m.quiz) continue;
      const best = await prisma.attempt.findFirst({ where: { userId, quizId: m.quiz.id }, orderBy: { score: "desc" } });
      if (best) { sum += best.score; count++; }
    }
    overallScore = count ? Math.round(sum / count) : 0;
  }
  const filePath = await generateCertificatePdf({ userName: user.name || user.email, userEmail: user.email, overallScore, contextTitle: "All Main Modules" });
  await (prisma as any).certificate.upsert({ where: { userId_mainModuleId: { userId, mainModuleId: null } }, update: { filePath, totalScore: overallScore }, create: { userId, mainModuleId: null, filePath, totalScore: overallScore } });
  return filePath;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");

  let userId = session.user.id as string;
  if (requestedUserId && requestedUserId !== userId) {
    // Only admins may download for others
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    userId = requestedUserId;
  }

  const filePath = await ensureFileForUser(userId);
  if (!filePath) return NextResponse.json({ message: "Not found" }, { status: 404 });

  try {
    const buf = await fs.promises.readFile(filePath);
    const name = path.basename(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
