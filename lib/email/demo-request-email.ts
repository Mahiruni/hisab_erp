import "server-only";

export const ADMIN_CONTACT_EMAIL = "mahir@hisabtech.com";

export type DemoRequestMessage = {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: string;
  teamSize: string;
  preferredContact: string;
  message: string;
  requestContext: string;
};

type DeliveryResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "not_configured" | "provider_error" | "network_error" };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function row(label: string, value: string) {
  return `<tr><td style="padding:10px 0;color:#647087;font-size:13px;font-weight:700;vertical-align:top;width:170px">${escapeHtml(label)}</td><td style="padding:10px 0;color:#14213d;font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(value || "Not provided")}</td></tr>`;
}

function buildText(request: DemoRequestMessage) {
  return [
    "New Hisab demo request",
    "",
    `Full name: ${request.fullName}`,
    `Company: ${request.businessName}`,
    `Email: ${request.email}`,
    `Phone: ${request.phone}`,
    `Business type: ${request.businessType}`,
    `Team size: ${request.teamSize}`,
    `Preferred contact: ${request.preferredContact}`,
    `Request context: ${request.requestContext || "Not provided"}`,
    "",
    "Customer message:",
    request.message || "No additional message was provided.",
  ].join("\n");
}

function buildHtml(request: DemoRequestMessage) {
  const message = escapeHtml(request.message || "No additional message was provided.").replaceAll("\n", "<br />");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid rgba(20,33,61,.10);border-radius:24px;overflow:hidden;box-shadow:0 24px 70px rgba(20,33,61,.12)">
          <tr><td style="padding:30px;background:linear-gradient(145deg,#0b1529,#14213d 62%,#22365f);color:#ffffff">
            <div style="font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#ffd98a">Hisab website</div>
            <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.15">New demo request</h1>
            <p style="margin:0;color:rgba(255,255,255,.72);font-size:14px;line-height:1.6">A prospective customer submitted the public demo form.</p>
          </td></tr>
          <tr><td style="padding:28px 30px 8px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${row("Full name", request.fullName)}
              ${row("Company", request.businessName)}
              ${row("Email", request.email)}
              ${row("Phone", request.phone)}
              ${row("Business type", request.businessType)}
              ${row("Team size", request.teamSize)}
              ${row("Preferred contact", request.preferredContact)}
              ${row("Request context", request.requestContext)}
            </table>
          </td></tr>
          <tr><td style="padding:20px 30px 30px">
            <div style="padding:20px;border-radius:16px;background:#f7f9fc;border:1px solid rgba(20,33,61,.08)">
              <div style="margin-bottom:9px;color:#647087;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase">Customer message</div>
              <div style="color:#14213d;font-size:15px;line-height:1.65">${message}</div>
            </div>
            <a href="mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(`Re: Hisab demo request for ${request.businessName}`)}" style="display:inline-block;margin-top:22px;padding:14px 20px;border-radius:999px;background:#14213d;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none">Reply to customer</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendDemoRequestEmail(request: DemoRequestMessage): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const from = process.env.DEMO_EMAIL_FROM?.trim() || "Hisab Website <notifications@hisabtech.com>";
  const idempotencyKey = `demo-${Buffer.from(`${request.email}:${request.phone}:${request.businessName}`)
    .toString("base64url")
    .slice(0, 180)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [ADMIN_CONTACT_EMAIL],
        reply_to: request.email,
        subject: `New Hisab demo request — ${request.businessName}`,
        text: buildText(request),
        html: buildHtml(request),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Demo request email provider rejected the message", { status: response.status });
      return { ok: false, reason: "provider_error" };
    }

    const payload = await response.json().catch(() => null) as { id?: string } | null;
    return { ok: true, id: payload?.id ?? null };
  } catch (error) {
    console.error("Demo request email delivery failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, reason: "network_error" };
  }
}
