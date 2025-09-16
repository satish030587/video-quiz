import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const modules = await (prisma as any).mainModule.findMany({ orderBy: { orderIndex: "asc" } });
  return NextResponse.json({ modules });
}

const bodySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  youtubeId: z.string().min(3),
  orderIndex: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { title, description, youtubeId, orderIndex, isActive } = parsed.data;
  const yt = extractYouTubeId(youtubeId);
  // Determine position; if inserting at a specific index, shift others down
  let finalOrder = orderIndex;
  if (!finalOrder) {
    const max = await (prisma as any).mainModule.aggregate({ _max: { orderIndex: true } });
    finalOrder = (max._max.orderIndex ?? 0) + 1;
  } else {
    await (prisma as any).mainModule.updateMany({ where: { orderIndex: { gte: finalOrder } }, data: { orderIndex: { increment: 1 } } });
  }
  const mod = await (prisma as any).mainModule.create({ data: { title, description: description || null, youtubeId: yt, orderIndex: finalOrder, isActive } });
  return NextResponse.json({ module: mod }, { status: 201 });
}
