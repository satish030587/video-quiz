import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyAndConsume } from "@/lib/tokenStore";
import { hitEndpoint } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });

  const rl = await hitEndpoint("verify-email", "global", 20, 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ message: "Too many requests" }, { status: 429 });

  const { token } = parsed.data;
  const chk = verifyAndConsume("verify-email", token);
  if (!chk.ok || !chk.userId) return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });

  await prisma.user.update({ where: { id: chk.userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
