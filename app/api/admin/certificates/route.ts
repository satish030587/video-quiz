import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const certs = await prisma.certificate.findMany();
  type SimpleUser = { id: string; email: string; name: string | null };
  const users: SimpleUser[] = await prisma.user.findMany({ select: { id: true, email: true, name: true } });

  // Determine current eligibility for each user
  const modules = await prisma.module.findMany({ include: { quiz: true }, orderBy: { order: "asc" } });
  const quizIds = modules.filter(m => m.quiz).map(m => (m.quiz as any).id) as string[];
  const attempts = await prisma.attempt.findMany({ where: { quizId: { in: quizIds } }, select: { userId: true, quizId: true, passed: true } });
  const passedMap = new Map<string, Set<string>>();
  for (const a of attempts) {
    if (!a.passed) continue;
    const set = passedMap.get(a.userId) || new Set<string>();
    set.add(a.quizId);
    passedMap.set(a.userId, set);
  }

  const rows = users.map((u: SimpleUser) => {
    const c = certs.find((c: { userId: string; filePath: string }) => c.userId === u.id);
    const set = passedMap.get(u.id) || new Set<string>();
    const eligibleNow = modules.length > 0 && modules.every(m => m.quiz && set.has((m.quiz as any).id));
    const url = c && eligibleNow ? `/api/certificate/download?userId=${encodeURIComponent(u.id)}` : undefined;
    return { userId: u.id, email: u.email, name: u.name, url };
  });
  return NextResponse.json({ rows });
}

