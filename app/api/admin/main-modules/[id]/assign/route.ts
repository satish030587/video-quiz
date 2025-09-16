import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const mainModuleId = Number(id);
  const assigned = await (prisma as any).module.findMany({ where: { mainModuleId }, orderBy: { orderWithinMain: "asc" } });
  const available = await prisma.module.findMany({ where: { OR: [ { mainModuleId: null as any }, { mainModuleId: undefined as any } ] }, orderBy: { order: "asc" } });
  return NextResponse.json({ assigned, available });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const schema = z.object({ moduleIds: z.array(z.string()) });
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const mainModuleId = Number(id);
  const { moduleIds } = parsed.data;

  // Unlink any modules currently assigned but not in the new list
  await (prisma as any).module.updateMany({ where: { mainModuleId, NOT: { id: { in: moduleIds } } }, data: { mainModuleId: null, orderWithinMain: null } });
  // Assign or reorder provided list
  let order = 1;
  for (const mid of moduleIds) {
    await (prisma as any).module.update({ where: { id: mid }, data: { mainModuleId, orderWithinMain: order++ } });
  }
  return NextResponse.json({ ok: true });
}
