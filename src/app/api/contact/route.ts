import { CONTACT_EMAIL } from "@/lib/site";

// The footer's contact form, when Web3Forms is not set up (see ContactForm):
// checks the fields and mails them to the conference team through Resend,
// with a sender on a domain verified there (RESEND_API_KEY + CONTACT_FROM).
// Replies go to the visitor. Without Resend it answers 503 and the form hands
// the message to the visitor's mail app.
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  // Honeypot filled in: a bot. Pretend it worked.
  if (clean(body.company, 200)) return Response.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  if (!key || !from) return Response.json({ error: "not configured" }, { status: 503 });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: `Contato pelo site · ${name}`,
      text: `Nome: ${name}\nE-mail: ${email}\n\n${message}`,
      html: `<p><strong>Nome:</strong> ${escape(name)}<br><strong>E-mail:</strong> ${escape(email)}</p><p>${escape(message).replace(/\n/g, "<br>")}</p>`,
    }),
  });
  if (!res.ok) {
    console.error("contact form:", res.status, await res.text().catch(() => ""));
    return Response.json({ error: "send failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
