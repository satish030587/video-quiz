import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4 text-[color:var(--color-brand)]">Profile</h1>
      <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)] max-w-[520px]">
        <ProfileForm />
      </div>
    </main>
  );
}
