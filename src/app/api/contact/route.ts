import { CONTACT_EMAIL } from "@/lib/site";

// The footer's contact form: checks the fields and mails them to the
// conference team, through the first service that is set up:
//   1. Resend, with a sender on a domain verified there (RESEND_API_KEY + CONTACT_FROM);
//   2. Web3Forms, with the access key issued to the conference inbox (WEB3FORMS_KEY);
//   3. FormSubmit, which needs nothing (its first message asks the inbox to confirm once).
// Either way, replies go to the visitor.
const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

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

  const subject = `Contato pelo site · ${name}`;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const web3 = process.env.WEB3FORMS_KEY;
  const res =
    key && from
      ? await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [CONTACT_EMAIL],
            reply_to: email,
            subject,
            text: `Nome: ${name}\nE-mail: ${email}\n\n${message}`,
            html: `<p><strong>Nome:</strong> ${escape(name)}<br><strong>E-mail:</strong> ${escape(email)}</p><p>${escape(message).replace(/\n/g, "<br>")}</p>`,
          }),
        })
      : web3
        ? await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              access_key: web3,
              subject,
              from_name: "Site Impact Minds",
              name,
              email,
              replyto: email,
              message,
            }),
          })
        : await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              // FormSubmit ties the inbox's confirmation to the site it is used from.
              Origin: "https://impactminds2027.vercel.app",
              Referer: "https://impactminds2027.vercel.app/",
            },
            body: JSON.stringify({
              Nome: name,
              "E-mail": email,
              Mensagem: message,
              _subject: subject,
              _replyto: email,
              _template: "table",
              _captcha: "false",
            }),
          });
  const text = await res.text().catch(() => "");
  // FormSubmit answers 200 with { success: "false" } on errors.
  if (!res.ok || /"success"\s*:\s*"?false/.test(text)) {
    console.error("contact form:", res.status, text);
    return Response.json({ error: "send failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
