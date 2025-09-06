import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAttemptQuiz } from "@/lib/quiz";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  moduleId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      optionKey: z.number().int().nonnegative().nullable().optional(),
    })
  ),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  // Ensure the user exists (stale session after DB reset or deletion)
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) return NextResponse.json({ message: "Session is stale. Please sign in again." }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  const { moduleId } = parsed.data;
  // Sanitize answers: ensure JSON-safe values (no undefined), clamp to integers
  const answers = parsed.data.answers.map((a) => ({ questionId: a.questionId, optionKey: typeof a.optionKey === 'number' ? a.optionKey : null }));

  const gate = await canAttemptQuiz(userId, moduleId);
  if (!gate.allowed) return NextResponse.json({ message: gate.reason || "Forbidden" }, { status: 403 });

  type QuizWithQs = { id: string; passScore: number; questions: Array<{ id: string; correctIndex: number }> };
  const quiz: QuizWithQs | null = await prisma.quiz.findUnique({ where: { moduleId }, include: { questions: { where: { active: true } } } });
  if (!quiz) return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  if (!quiz.questions.length) return NextResponse.json({ message: "No active questions" }, { status: 400 });

  // Build maps
  const qMap = new Map(quiz.questions.map((q: { id: string; correctIndex: number }) => [q.id, q] as const));

  let correct = 0;
  let totalAnswered = 0;
  for (const a of answers) {
    if (!a || !a.questionId) continue;
    const q = qMap.get(a.questionId);
    if (!q) continue;
    const k = a.optionKey;
    if (k != null) {
      totalAnswered += 1;
      if (k === q.correctIndex) correct += 1;
    }
  }
  const totalQuestions = quiz.questions.length;
  const score = Math.round((correct / totalQuestions) * 100);
  const passed = score >= quiz.passScore;

  // Determine next attempt number
  const lastAttempt = await prisma.attempt.findFirst({
    where: { userId, quizId: quiz.id },
    orderBy: { attemptNo: "desc" },
  });
  const attemptNo = (lastAttempt?.attemptNo ?? 0) + 1;
  if (attemptNo > 2) return NextResponse.json({ message: "No attempts left" }, { status: 403 });

  try {
    await prisma.attempt.create({
      data: {
        userId,
        quizId: quiz.id,
        attemptNo,
        score,
        passed,
        answersJson: answers as any,
      },
    });
  } catch (e: any) {
    console.error('[attempt] create failed', e);
    return NextResponse.json({ message: "Failed to record attempt" }, { status: 500 });
  }

  const attemptsRemaining = Math.max(0, 2 - attemptNo);
  const totalWrong = Math.max(0, totalAnswered - correct);
  return NextResponse.json({ score, passed, attemptNo, attemptsRemaining, totalQuestions, totalAnswered, totalCorrect: correct, totalWrong, passScore: quiz.passScore });
}
