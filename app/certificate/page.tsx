import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Use a relative URL so Next forwards cookies; handle non-JSON safely
  const res = await fetch(`/api/certificate`, { cache: "no-store" });
  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    // Fallback for unexpected HTML/error responses (e.g., redirects)
    return (
      <main>
        <h1>Certificate</h1>
        <p>Failed to load certificate status.</p>
        <p style={{opacity:0.8}}>Please refresh the page or try again.</p>
        <Link href="/">Back to Dashboard</Link>
      </main>
    );
  }
  return (
    <main>
      <h1>Certificate</h1>
      {data.url ? (
        <p>Your certificate is ready: <a href={data.url} target="_blank">Download PDF</a></p>
      ) : data.eligible ? (
        <form action="/api/certificate" method="post">
          <button type="submit">Generate Certificate</button>
        </form>
      ) : (
        <p>Complete all modules to unlock your certificate.</p>
      )}
      <Link href="/">Back to Dashboard</Link>
    </main>
  );
}
