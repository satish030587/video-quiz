import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({ 
  text: z.string().min(1).optional(), 
  options: z.array(z.string().min(1)).min(2).optional(), 
  correctIndex: z.number().int().nonnegative().optional(), 
  active: z.boolean().optional(),
  // New fields
  questionType: z.enum(["MCQ_4", "MCQ_2", "TRUE_FALSE"]).optional(),
  correctAnswer: z.string().optional(),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input", errors: parsed.error.format() }, { status: 400 });
  const data = parsed.data as any;
  
  // Validate correct index if options are provided
  if (data.options && data.correctIndex != null) {
    if (data.correctIndex < 0 || data.correctIndex >= data.options.length) 
      return NextResponse.json({ message: "correctIndex out of range" }, { status: 400 });
  }
  
  const { id } = await params;
  const q = await prisma.question.update({ where: { id }, data });
  return NextResponse.json({ question: q });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

