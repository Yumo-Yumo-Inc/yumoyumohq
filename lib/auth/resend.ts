import {
  buildPasswordResetEmailTemplate,
  buildVerificationEmailTemplate,
} from "@/lib/auth/email-templates";

interface SendVerificationEmailInput {
  email: string;
  username: string;
  verificationUrl: string;
}

interface SendPasswordResetEmailInput {
  email: string;
  username: string;
  resetUrl: string;
}

interface SendAuthEmailInput {
  email: string;
  subject: string;
  html: string;
}

function getResendApiKey(): string | undefined {
  const raw = process.env.RESEND_API_KEY;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resend requires a verified domain or their test sender. `example.com` is rejected;
 * use `EMAIL_FROM` with your domain, or rely on the Resend test default below.
 * @see https://resend.com/docs/dashboard/emails/send-test-emails
 */
function getEmailFrom(): string {
  const explicit = process.env.EMAIL_FROM?.trim();
  if (explicit) return explicit;
  return "Yumo Yumo <onboarding@resend.dev>";
}

/** Returns true if Resend accepted the message; false when send was skipped (no API key in non-production). */
async function sendAuthEmail(input: SendAuthEmailInput): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Resend is not configured");
    }
    console.info("[resend] Auth email skipped for:", input.email);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: input.email,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend email send failed: ${body}`);
  }
  return true;
}

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<boolean> {
  const template = buildVerificationEmailTemplate({
    username: input.username,
    actionUrl: input.verificationUrl,
  });

  return sendAuthEmail({
    email: input.email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<boolean> {
  const template = buildPasswordResetEmailTemplate({
    username: input.username,
    actionUrl: input.resetUrl,
  });

  return sendAuthEmail({
    email: input.email,
    subject: template.subject,
    html: template.html,
  });
}
