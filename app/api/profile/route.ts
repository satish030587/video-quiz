import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfileMeta, setProfileMeta } from "@/lib/profileStore";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true } });
  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const meta = getProfileMeta(user.id);
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, ...meta });
}

const patchSchema = z.object({ name: z.string().min(2).optional(), email: z.string().email().optional(), address: z.string().optional(), phone: z.string().optional() });

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { name, email, address, phone } = parsed.data;
  if (name !== undefined || email !== undefined) {
    try {
      await prisma.user.update({ where: { id: session.user.id }, data: { name: name as any, email: email as any } });
    } catch (e: any) {
      return NextResponse.json({ message: "Failed to update core profile" }, { status: 400 });
    }
  }
  if (address !== undefined || phone !== undefined) {
    setProfileMeta(session.user.id, { address, phone });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true } });
  const meta = getProfileMeta(session.user.id);
  return NextResponse.json({ id: session.user.id, name: user?.name, email: user?.email, ...meta });
}

