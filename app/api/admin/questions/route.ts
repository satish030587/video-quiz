import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const moduleId = url.searchParams.get("moduleId");
  if (!moduleId) return NextResponse.json({ message: "moduleId required" }, { status: 400 });
  const quiz = await prisma.quiz.findUnique({ where: { moduleId }, include: { questions: true } });
  if (!quiz) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  return NextResponse.json({ questions: quiz.questions });
}

const createSchema = z.object({ moduleId: z.string(), text: z.string().min(4), options: z.array(z.string().min(1)).min(2), correctIndex: z.number().int().nonnegative() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { moduleId, text, options, correctIndex } = parsed.data;
  const quiz = await prisma.quiz.findUnique({ where: { moduleId } });
  if (!quiz) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  if (correctIndex < 0 || correctIndex >= options.length) return NextResponse.json({ message: "correctIndex out of range" }, { status: 400 });
  const q = await prisma.question.create({ data: { quizId: quiz.id, text, options, correctIndex } });
  return NextResponse.json({ question: q }, { status: 201 });
}

