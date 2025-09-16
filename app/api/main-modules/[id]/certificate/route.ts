import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import { getMainModuleProgress } from "@/lib/quiz";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAssigned(moduleId: number) {
  const subs = await prisma.module.findMany({ where: { mainModuleId: moduleId } as any, include: { quiz: true } });
  return subs.filter((m: any) => !!m.quiz);
}

async function eligibleForMain(userId: string, mainModuleId: number) {
  // Use the getMainModuleProgress function to determine eligibility
  const tree = await getMainModuleProgress(userId);
  const main = tree.find(m => m.id === mainModuleId);
  return !!main?.completed;
}

async function computeScore(userId: string, mainModuleId: number) {
  // Use the getMainModuleProgress function to get the average for certificate
  const tree = await getMainModuleProgress(userId);
  const main = tree.find(m => m.id === mainModuleId);
  return main?.averageForCertificate || 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const mainModuleId = Number(id);
  const elig = await eligibleForMain(session.user.id as string, mainModuleId);
  const existing = await (prisma as any).certificate.findFirst({ where: { userId: session.user.id, mainModuleId } });
  const url = existing && elig ? `/api/main-modules/${mainModuleId}/certificate/download` : undefined;
  return NextResponse.json({ eligible: elig, url });
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const mainModuleId = Number(id);
  const elig = await eligibleForMain(session.user.id as string, mainModuleId);
  if (!elig) return NextResponse.json({ message: "Not eligible" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id as string } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  const main = await (prisma as any).mainModule.findUnique({ where: { id: mainModuleId } });
  const score = await computeScore(session.user.id as string, mainModuleId);
  // Use distinct filename to avoid clobbering global cert
  const safe = (user.email || user.id).replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${safe}_main_${mainModuleId}.pdf`;
  const filePath = await generateCertificatePdf({ userName: user.name || user.email || user.id, userEmail: user.email || user.id, overallScore: score, fileName, contextTitle: main?.title });
  await (prisma as any).certificate.upsert({ where: { userId_mainModuleId: { userId: user.id, mainModuleId } }, update: { filePath, totalScore: score }, create: { userId: user.id, mainModuleId, filePath, totalScore: score } });
  return NextResponse.json({ url: `/api/main-modules/${mainModuleId}/certificate/download` });
}
