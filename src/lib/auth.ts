import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { authenticator } from "otplib";
import { clearLoginFailures, recordLoginFailure, hitLoginIp } from "@/lib/rateLimit";

// Accept optional OTP; treat empty strings as undefined
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().optional(),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email"}, password: { label: "Password", type: "password" }, otp: { label: "OTP", type: "text" } },
      async authorize(creds, req) {
        const parsed = schema.safeParse(creds as any);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const otpRaw = (creds as any)?.otp as string | undefined;
        const otp = otpRaw && otpRaw.trim().length ? otpRaw.trim() : undefined;
        const ip = (req as any)?.headers?.["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || (req as any)?.ip || "";

        // Global IP throttle guard
        await hitLoginIp(ip);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // uniform failure; record against email
          await recordLoginFailure(email, ip);
          return null;
        }
        if (user.disabledAt) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          const { reachedLockThreshold } = await recordLoginFailure(email, ip);
          if (reachedLockThreshold) {
            // 15 minute lockout
            prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } }).catch(() => {});
          }
          return null;
        }

        // Require verified email (allow dev bypass for admins only)
        if (!user.emailVerifiedAt) {
          const devBypass = process.env.NODE_ENV !== 'production' && user.role === 'ADMIN';
          if (!devBypass) return null;
        }

        // Enforce MFA for admins that have enrolled
        if (user.role === "ADMIN" && user.mfaSecret) {
          const valid = otp && authenticator.verify({ token: otp, secret: user.mfaSecret });
          if (!valid) {
            await recordLoginFailure(email, ip);
            return null;
          }
        }

        await clearLoginFailures(email);
        prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lockedUntil: null } }).catch(() => {});
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { (token as any).role = (user as any).role; (token as any).uid = (user as any).id; }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = (token as any).uid;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) { return url.startsWith(baseUrl) ? url : baseUrl; },
  },
  pages: { signIn: "/login" },
};
