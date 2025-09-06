// app/api/auth/[...nextauth]/route.ts (root app dir)
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Ensure Node runtime and no caching for auth endpoints
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
