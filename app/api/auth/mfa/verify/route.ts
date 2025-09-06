import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authenticator } from "otplib";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ secret: z.string().min(10), token: z.string().min(3) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { secret, token } = parsed.data;
  const ok = authenticator.verify({ token, secret });
  if (!ok) return NextResponse.json({ message: "Invalid code" }, { status: 400 });
  await prisma.user.update({ where: { id: session.user.id }, data: { mfaSecret: secret } });
  return NextResponse.json({ ok: true });
}

