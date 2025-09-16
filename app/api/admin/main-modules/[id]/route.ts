import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const schema = z.object({ title: z.string().min(2).optional(), description: z.string().optional().nullable(), youtubeId: z.string().min(3).optional(), orderIndex: z.number().int().positive().optional(), isActive: z.boolean().optional() });
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const data: any = { ...parsed.data };
  if (data.youtubeId) data.youtubeId = extractYouTubeId(data.youtubeId);
  // Handle order changes by shifting others
  if (data.orderIndex) {
    const current = await (prisma as any).mainModule.findUnique({ where: { id: Number(id) } });
    if (!current) return NextResponse.json({ message: "Not found" }, { status: 404 });
    const newIndex: number = data.orderIndex;
    const oldIndex = current.orderIndex;
    if (newIndex !== oldIndex) {
      if (newIndex < oldIndex) {
        await (prisma as any).mainModule.updateMany({ where: { orderIndex: { gte: newIndex, lt: oldIndex } }, data: { orderIndex: { increment: 1 } } });
      } else {
        await (prisma as any).mainModule.updateMany({ where: { orderIndex: { gt: oldIndex, lte: newIndex } }, data: { orderIndex: { decrement: 1 } } });
      }
    }
  }
  const updated = await (prisma as any).mainModule.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ module: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  // Unlink sub-modules first
  await (prisma as any).module.updateMany({ where: { mainModuleId: Number(id) }, data: { mainModuleId: null, orderWithinMain: null } });
  await (prisma as any).mainModule.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
