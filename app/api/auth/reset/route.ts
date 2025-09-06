import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { verifyAndConsume } from "@/lib/tokenStore";
import { hitEndpoint } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(10), password: z.string().min(8) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });

  const rl = await hitEndpoint("reset", "global", 20, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ message: "Too many requests" }, { status: 429 });

  const { token, password } = parsed.data;
  const chk = verifyAndConsume("reset", token);
  if (!chk.ok || !chk.userId) return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: chk.userId }, data: { passwordHash, lockedUntil: null } });
  return NextResponse.json({ ok: true });
}
