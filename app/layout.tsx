import type { Metadata } from "next";
import Providers from "./providers";
import Header from "./header";
import UserShell from "./user-shell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "./globals.css";
import { Inter, Merriweather } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merri = Merriweather({ subsets: ["latin"], weight: ["400","700"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Sarvahitha Ayurvedalaya Pvt Ltd · Video Quiz",
  description: "Quiz portal by Sarvahitha Ayurvedalaya Pvt Ltd",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merri.variable} bg-[color:var(--color-muted)] text-[color:var(--color-text)] min-h-screen antialiased`}>
        <Providers session={session}>
          <Header />
          <main className="px-4 py-4">
            <UserShell>{children}</UserShell>
          </main>
        </Providers>
      </body>
    </html>
  );
}

