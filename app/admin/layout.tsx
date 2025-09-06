import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[calc(100vh-56px)] gap-3 md:gap-0">
      <aside className="md:border-r border-b md:border-b-0 px-3 py-3 bg-white">
        <h3 className="mt-0 mb-3 text-[color:var(--color-brand)] font-semibold">Admin</h3>
        <AdminSidebar />
      </aside>
      <section className="p-1 md:p-4">{children}</section>
    </div>
  );
}
