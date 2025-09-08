"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const sp = useSearchParams();
  const err = sp.get("error");
  let errMsg: string | null = null;
  if (err === "CredentialsSignin") {
    errMsg = "Sign-in failed. Check email/password. If admin MFA is enabled, enter your 6-digit OTP. Also ensure your email is verified or reset your password if locked.";
  } else if (err) {
    errMsg = "Sign-in error. Please try again.";
  }
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
      <div className="text-center">
        <div className="text-[color:var(--color-brand)] font-semibold text-lg">Sarvahitha Ayurvedalaya Pvt Ltd</div>
        <div className="text-slate-500 text-sm">Quiz Portal</div>
      </div>
      <h1 className="text-2xl font-semibold mt-4 mb-4 text-[color:var(--color-brand)] text-center">Login</h1>
      {errMsg && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-900 px-3 py-2 text-sm">
          {errMsg}
        </div>
      )}
      <div className="rounded border border-slate-200 bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 text-center">
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]" placeholder="OTP (if required)" value={otp} onChange={e=>setOtp(e.target.value)} />
          <button className="rounded bg-[color:var(--color-brand)] text-white px-3 py-2 text-sm hover:opacity-95" onClick={async()=>{
            const body: any = { email, password, callbackUrl:"/" };
            if (otp.trim()) body.otp = otp.trim();
            await signIn("credentials", body);
          }}>Sign In</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm justify-center">
          <a className="underline" href="/forgot">Forgot password?</a>
          <a className="underline" href="#" onClick={async (e)=>{ e.preventDefault(); if(!email) return alert('Enter email above to resend'); try { await fetch('/api/auth/verify/resend', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) }); alert('If that email exists, a verification link was sent.'); } catch {} }}>Resend verification</a>
        </div>
      </div>
      </div>
    </main>
  );
}

