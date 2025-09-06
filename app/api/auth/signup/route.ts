import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { verifyAndConsume } from "@/lib/tokenStore";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(10), name: z.string().min(2), password: z.string().min(8) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { token, name, password } = parsed.data;

  const chk = verifyAndConsume("invite", token);
  if (!chk.ok || !chk.userId) return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.user.update({ where: { id: chk.userId }, data: { name, passwordHash, emailVerifiedAt: new Date() } });
  } catch {
    return NextResponse.json({ message: "Signup failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

