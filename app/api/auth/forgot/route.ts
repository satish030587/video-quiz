import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createToken } from "@/lib/tokenStore";
import { hitEndpoint } from "@/lib/rateLimit";
import { appOrigin, sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  // Always respond 200 to avoid email enumeration
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  const rl = await hitEndpoint("forgot", email, 5, 15 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = createToken(user.id, "reset", 30);
    const link = `${appOrigin()}/reset?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: email, subject: "Password reset", html: `<p>Click to reset your password:</p><p><a href="${link}">${link}</a></p>` });
  }
  return NextResponse.json({ ok: true });
}
