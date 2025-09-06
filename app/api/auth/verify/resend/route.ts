import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createToken } from "@/lib/tokenStore";
import { hitEndpoint } from "@/lib/rateLimit";
import { appOrigin, sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  // Generic ok to avoid enumeration
  if (!parsed.success) return NextResponse.json({ ok: true });
  const email = parsed.data.email.toLowerCase();

  const rl = await hitEndpoint("verify-resend", email, 5, 15 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerifiedAt) {
    const token = createToken(user.id, "verify-email", 60);
    const link = `${appOrigin()}/verify?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: email, subject: "Verify your email", html: `<p>Click to verify your email:</p><p><a href="${link}">${link}</a></p>` });
  }
  return NextResponse.json({ ok: true });
}

