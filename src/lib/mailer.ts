export type MailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export async function sendEmail({ to, subject, html, text, from }: MailInput) {
  // Default from for dev
  const fromAddr = from || process.env.EMAIL_FROM || "onboarding@resend.dev";
  let delivered = false;

  // 1) Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !delivered) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: fromAddr, to, subject, html, text }),
      });
      if (res.ok) {
        delivered = true;
      } else {
        const body = await res.text().catch(() => "");
        console.warn("[mailer] Resend failed:", res.status, body);
      }
    } catch (e) {
      console.warn("[mailer] Resend error:", e);
    }
  }

  // 2) SendGrid
  const sgKey = process.env.SENDGRID_API_KEY;
  if (sgKey && !delivered) {
    try {
      const payload = {
        personalizations: [
          { to: (Array.isArray(to) ? to : [to]).map((t: string) => ({ email: t })) },
        ],
        from: { email: fromAddr },
        subject,
        content: [
          { type: html ? "text/html" : "text/plain", value: html || text || "" },
        ],
      } as any;
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sgKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        delivered = true;
      } else {
        const body = await res.text().catch(() => "");
        console.warn("[mailer] SendGrid failed:", res.status, body);
      }
    } catch (e) {
      console.warn("[mailer] SendGrid error:", e);
    }
  }

  // 3) Dev fallback (no provider or provider failed)
  if (!delivered) {
    console.log(
      "[mailer:dev] To:",
      to,
      "Subject:",
      subject,
      "HTML:",
      html,
      "Text:",
      text
    );
  }
}

export function appOrigin() {
  return (
    process.env.NEXTAUTH_URL || process.env.APP_ORIGIN || "http://localhost:3000"
  );
}
