import { Resend } from "resend";
import QRCode from "qrcode";

/**
 * Read at call time (not module scope) so the flag follows runtime env vars
 * even when the bundler inlined an unset value at build time.
 */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || "Visitor Management <onboarding@resend.dev>"
  );
}

export type QrEmailInput = {
  to: string;
  visitorName: string;
  qrCode: string;
  departmentName?: string | null;
  purpose?: string | null;
  expiresAt?: Date | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(input: QrEmailInput): string {
  const name = escapeHtml(input.visitorName);
  const code = escapeHtml(input.qrCode);
  const department = input.departmentName ? escapeHtml(input.departmentName) : null;
  const purpose = input.purpose ? escapeHtml(input.purpose) : null;
  const expires = input.expiresAt
    ? new Date(input.expiresAt).toUTCString()
    : null;

  const rows = [
    department
      ? `<tr><td style="padding:6px 0;color:#64748b;">Office / Department</td><td style="padding:6px 0;font-weight:600;">${department}</td></tr>`
      : null,
    purpose
      ? `<tr><td style="padding:6px 0;color:#64748b;">Purpose</td><td style="padding:6px 0;font-weight:600;">${purpose}</td></tr>`
      : null,
    expires
      ? `<tr><td style="padding:6px 0;color:#64748b;">Valid until</td><td style="padding:6px 0;font-weight:600;">${expires}</td></tr>`
      : null,
  ]
    .filter(Boolean)
    .join("");

  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;">
    <h1 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Your visitor QR code</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Hi ${name}, here is the QR code for your visit.</p>
    <img src="cid:qrcode" alt="QR code" width="220" height="220" style="display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;" />
    <p style="margin:16px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;font-weight:700;letter-spacing:1px;color:#0f172a;">${code}</p>
    <p style="margin:4px 0 24px;font-size:12px;color:#94a3b8;">Show this code at the guard station to check in.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;text-align:left;">
      <tr><td style="padding:6px 0;color:#64748b;">Visitor</td><td style="padding:6px 0;font-weight:600;">${name}</td></tr>
      ${rows}
    </table>
  </div>
</div>`.trim();
}

/**
 * Emails the visitor their QR code. Returns false (never throws) when the
 * provider is unconfigured or the send fails, so registration can proceed.
 */
export async function sendQrEmail(input: QrEmailInput): Promise<boolean> {
  if (!input.to || !process.env.RESEND_API_KEY) return false;

  try {
    const png = await QRCode.toBuffer(input.qrCode, {
      width: 440,
      margin: 2,
      color: { dark: "#1e293b", light: "#ffffff" },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject: `Your visitor QR code — ${input.qrCode}`,
      html: buildHtml(input),
      attachments: [
        {
          filename: `qr-${input.qrCode}.png`,
          content: png,
          contentType: "image/png",
          contentId: "qrcode",
        },
      ],
    });

    if (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "QR_EMAIL_FAILED",
          to: input.to,
          error: error.message,
        })
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "QR_EMAIL_FAILED",
        to: input.to,
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return false;
  }
}
