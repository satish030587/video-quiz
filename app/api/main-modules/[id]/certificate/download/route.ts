import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const mainModuleId = Number(id);
  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");

  let userId = session.user.id as string;
  if (requestedUserId && requestedUserId !== userId) {
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    userId = requestedUserId;
  }

  const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId } });
  if (!cert) return NextResponse.json({ message: "Not found" }, { status: 404 });
  try {
    const buf = await fs.promises.readFile(cert.filePath);
    const name = path.basename(cert.filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}

