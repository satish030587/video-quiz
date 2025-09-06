import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((v) => '"' + (v?.replaceAll('"', '""') || '') + '"').join(",")).join("\n");
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "completions";
  let csv = "";
  if (type === "completions") {
    const quizzes = await prisma.quiz.findMany({ include: { module: true } });
    const attempts = await prisma.attempt.findMany({ include: { user: true } });
    const header = ["User Email", "User Name", "Module", "Score", "Passed", "Attempt #", "Submitted At"];
    const rows: string[][] = [header];
    const quizModule = new Map(quizzes.map((q) => [q.id, `${q.module.order}. ${q.module.title}`] as const));
    for (const a of attempts) {
      rows.push([
        a.user.email,
        a.user.name,
        quizModule.get(a.quizId) || a.quizId,
        String(a.score),
        a.passed ? "yes" : "no",
        String(a.attemptNo),
        a.submittedAt.toISOString(),
      ]);
    }
    csv = toCSV(rows);
  } else if (type === "attempts") {
    const attempts = await prisma.attempt.findMany({ include: { user: true } });
    const header = ["Attempt ID", "User Email", "Quiz ID", "Attempt #", "Score", "Passed", "Submitted At"];
    const rows: string[][] = [header];
    for (const a of attempts) {
      rows.push([a.id, a.user.email, a.quizId, String(a.attemptNo), String(a.score), a.passed ? "yes" : "no", a.submittedAt.toISOString()]);
    }
    csv = toCSV(rows);
  } else {
    return new NextResponse("Unknown report", { status: 400 });
  }
  return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8" } });
}

