import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { setProfileMeta } from "@/lib/profileStore";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  disabled: z.boolean().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  password: z.string().min(8).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const id = params.id;
  const data: any = {};
  if (parsed.data.disabled !== undefined) data.disabledAt = parsed.data.disabled ? new Date() : null;
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.role !== undefined) data.role = parsed.data.role as any;
  if (parsed.data.password !== undefined) {
    const bcrypt = await import("bcrypt");
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }
  try {
    const user = await prisma.user.update({ where: { id }, data });
    if (parsed.data.address !== undefined || parsed.data.phone !== undefined) {
      setProfileMeta(id, { address: parsed.data.address, phone: parsed.data.phone });
    }
    return NextResponse.json({ user: { id: user.id } });
  } catch (e: any) {
    // Unique constraint (e.g., email) or others
    return NextResponse.json({ message: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const id = params.id;
  if (id === session.user.id) return NextResponse.json({ message: "You cannot delete your own account" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ ok: true });
  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return NextResponse.json({ message: "Cannot delete the last admin" }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
