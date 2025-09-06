// middleware.ts
import { withAuth } from "next-auth/middleware";
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const url = req.nextUrl.pathname;
      // Allow unauthenticated access to public auth pages and NextAuth endpoints
      const publicPaths = [
        "/login",
        "/forgot",
        "/reset",
        "/verify",
        "/signup",
        "/api/auth",
      ];
      if (!token) return publicPaths.some((p) => url.startsWith(p));
      // Admin-only protection
      if (url.startsWith("/admin")) return (token as any).role === "ADMIN";
      return true;
    },
  },
});
export const config = { matcher: ["/((?!_next|favicon.ico|public).*)"] };
