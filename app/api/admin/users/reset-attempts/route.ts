import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ userId: z.string(), moduleId: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { userId, moduleId } = parsed.data;
  const quiz = await prisma.quiz.findUnique({ where: { moduleId } });
  if (!quiz) return NextResponse.json({ message: "Quiz not found for module" }, { status: 404 });
  await prisma.attempt.deleteMany({ where: { userId, quizId: quiz.id } });
  // Invalidate any existing certificate for this user
  try {
    const cert = await prisma.certificate.findUnique({ where: { userId } });
    if (cert) {
      await prisma.certificate.delete({ where: { userId } });
      if (cert.filePath && fs.existsSync(cert.filePath)) {
        fs.unlink(cert.filePath, () => {});
      }
    }
  } catch {}
  return NextResponse.json({ ok: true });
}

