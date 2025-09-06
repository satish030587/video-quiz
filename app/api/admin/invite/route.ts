import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createToken } from "@/lib/tokenStore";
import { appOrigin, sendEmail } from "@/lib/mailer";
import { hitEndpoint } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email(), name: z.string().min(1).optional() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name || "";

  // Basic rate limit per admin
  const rl = await hitEndpoint("invite", session.user.id, 50, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ message: "Too many invites" }, { status: 429 });

  let user = await prisma.user.findUnique({ where: { email } });
  if (user && user.emailVerifiedAt) {
    return NextResponse.json({ message: "User already active" }, { status: 409 });
  }
  if (!user) {
    const bcrypt = await import("bcrypt");
    const tempHash = await bcrypt.hash(Math.random().toString(36).slice(2), 10);
    user = await prisma.user.create({
      data: { email, name, role: "EMPLOYEE", passwordHash: tempHash, emailVerifiedAt: null },
    });
  }

  const token = createToken(user.id, "invite", 60 * 24 * 7); // 7 days
  const link = `${appOrigin()}/signup?token=${encodeURIComponent(token)}`;
  const html = `
    <p>Hi${name ? ` ${name}` : ""},</p>
    <p>You have been invited to the Video Quiz portal. Click the link below to complete your signup and set a password:</p>
    <p><a href="${link}">${link}</a></p>
    <p>If you did not expect this, you can ignore this email.</p>
  `;
  await sendEmail({ to: email, subject: "You're invited to Video Quiz", html });

  return NextResponse.json({ ok: true });
}

