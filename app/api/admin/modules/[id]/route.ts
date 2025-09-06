import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  youtubeId: z.string().min(3).optional(),
  order: z.number().int().positive().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const data: any = parsed.data;
  if (data.description === undefined) {
    // keep as-is
  } else if (data.description === "") {
    data.description = null;
  }
  if (data.youtubeId) data.youtubeId = extractYouTubeId(data.youtubeId);
  // Handle reordering if order is provided
  if (data.order != null) {
    const current = await prisma.module.findUnique({ where: { id: params.id } });
    if (current && current.order !== data.order) {
      const newOrder = data.order as number;
      if (newOrder > current.order) {
        await prisma.module.updateMany({ where: { order: { gt: current.order, lte: newOrder } }, data: { order: { decrement: 1 } } });
      } else {
        await prisma.module.updateMany({ where: { order: { gte: newOrder, lt: current.order } }, data: { order: { increment: 1 } } });
      }
    }
  }
  const mod = await prisma.module.update({ where: { id: params.id }, data });
  return NextResponse.json({ module: mod });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const m = await prisma.module.findUnique({ where: { id: params.id } });
  if (!m) return NextResponse.json({ ok: true });
  const oldOrder = m.order;
  await prisma.module.delete({ where: { id: params.id } });
  await prisma.module.updateMany({ where: { order: { gt: oldOrder } }, data: { order: { decrement: 1 } } });
  return NextResponse.json({ ok: true });
}
