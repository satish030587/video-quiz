import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  type QuizWithModule = {
    id: string;
    moduleId: string;
    passScore: number;
    timeLimitSeconds: number;
    module: { title: string; order: number };
  };
  const quizzes: QuizWithModule[] = await prisma.quiz.findMany({ include: { module: true }, orderBy: { module: { order: "asc" } } });
  const rows = quizzes.map((q) => ({ id: q.id, moduleId: q.moduleId, moduleTitle: q.module.title, order: q.module.order, passScore: q.passScore, timeLimitSeconds: q.timeLimitSeconds }));
  return NextResponse.json({ quizzes: rows });
}

const upsertSchema = z.object({ moduleId: z.string(), passScore: z.number().int().min(1).max(100), timeLimitSeconds: z.number().int().min(30) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { moduleId, passScore, timeLimitSeconds } = parsed.data;
  const quiz = await prisma.quiz.upsert({ where: { moduleId }, create: { moduleId, passScore, timeLimitSeconds }, update: { passScore, timeLimitSeconds } });
  return NextResponse.json({ quiz }, { status: 201 });
}

