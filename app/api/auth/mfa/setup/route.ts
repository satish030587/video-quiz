import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authenticator } from "otplib";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // Generate a TOTP secret and otpauth URL; client must verify before we persist.
  const secret = authenticator.generateSecret();
  const label = encodeURIComponent(session.user.email || "admin");
  const issuer = encodeURIComponent("Video Quiz");
  const otpauth = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;
  return NextResponse.json({ secret, otpauth });
}

