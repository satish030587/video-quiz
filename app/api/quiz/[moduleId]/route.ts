import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAttemptQuiz } from "@/lib/quiz";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(_req: Request, { params }: { params: Promise<{ moduleId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;
  const gate = await canAttemptQuiz(session.user.id, moduleId);
  if (!gate.allowed) return NextResponse.json({ message: gate.reason || "Forbidden" }, { status: 403 });

  const quiz = await prisma.quiz.findUnique({
    where: { moduleId },
    include: { module: true, questions: { where: { active: true } } },
  });
  let qz = quiz;
  if (!qz) {
    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) return NextResponse.json({ message: "Module not found" }, { status: 404 });
    await prisma.quiz.create({ data: { moduleId, passScore: 70, timeLimitSeconds: 300 } });
    qz = await prisma.quiz.findUnique({
      where: { moduleId },
      include: { module: true, questions: { where: { active: true } } },
    });
  }
  // Ensure we have a quiz record before proceeding (type narrowing)
  if (!qz) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  type SimpleQuestion = { id: string; text: string; options: string[] };
  const questions: SimpleQuestion[] = (
    qz.questions?.length
      ? qz.questions
      : await prisma.question.findMany({ where: { quizId: qz.id, active: true } })
  ) as SimpleQuestion[];
  if (!questions.length) return NextResponse.json({ message: "No active questions" }, { status: 404 });

  const safeQuestions = questions.map((q) => {
    const options = q.options.map((text, key) => ({ key, text }));
    return { id: q.id, text: q.text, options: shuffle(options) };
  });

  const moduleInfo = quiz?.module || await prisma.module.findUnique({ where: { id: moduleId } });
  if (!moduleInfo) return NextResponse.json({ message: "Module not found" }, { status: 404 });
  return NextResponse.json({
    module: { id: moduleInfo.id, title: moduleInfo.title, order: moduleInfo.order },
    quiz: { passScore: qz.passScore, timeLimitSeconds: qz.timeLimitSeconds },
    questions: safeQuestions,
  });
}
