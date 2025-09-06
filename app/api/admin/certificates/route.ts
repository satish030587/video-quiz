import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const certs = await prisma.certificate.findMany();
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  const byUser = new Map(users.map((u) => [u.id, u] as const));
  const rows = users.map((u) => {
    const c = certs.find((c) => c.userId === u.id);
    return { userId: u.id, email: u.email, name: u.name, url: c ? `/certificates/${path.basename(c.filePath)}` : undefined };
  });
  return NextResponse.json({ rows });
}

