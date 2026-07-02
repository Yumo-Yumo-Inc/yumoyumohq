interface BaseAuthEmailInput {
  username: string;
  actionUrl: string;
}

interface AuthEmailTemplate {
  subject: string;
  html: string;
}

function buildBaseEmailShell({
  eyebrow,
  title,
  body,
  cta,
  actionUrl,
  footer,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  actionUrl: string;
  footer: string;
}) {
  return `
    <div style="margin:0;padding:32px 16px;background:#0a0f16;color:#f5f0df;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:620px;margin:0 auto;border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#121a25 0%,#0d131c 100%);border:1px solid rgba(201,168,76,0.22);box-shadow:0 24px 60px rgba(0,0,0,0.35);">
        <div style="padding:28px 32px 18px;background:radial-gradient(circle at top left,rgba(201,168,76,0.20),transparent 40%),linear-gradient(135deg,#171f2c 0%,#101722 100%);border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.22);color:#ecd38f;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            ${eyebrow}
          </div>
          <h1 style="margin:18px 0 10px;font-size:34px;line-height:1.08;color:#fff7df;font-weight:800;">
            ${title}
          </h1>
          <p style="margin:0;font-size:16px;line-height:1.8;color:#d0d6e1;">
            ${body}
          </p>
        </div>
        <div style="padding:28px 32px;">
          <div style="margin-bottom:22px;padding:18px 18px 16px;border-radius:20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#9aa7bc;text-transform:uppercase;letter-spacing:0.08em;">
              Secure link
            </p>
            <a href="${actionUrl}" style="color:#f5deb0;font-size:14px;line-height:1.7;word-break:break-word;text-decoration:none;">
              ${actionUrl}
            </a>
          </div>
          <a href="${actionUrl}" style="display:inline-block;padding:15px 24px;border-radius:16px;background:#c9a84c;color:#0d1117;font-weight:800;font-size:15px;text-decoration:none;box-shadow:0 8px 24px rgba(201,168,76,0.22);">
            ${cta}
          </a>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.8;color:#94a0b3;">
            ${footer}
          </p>
        </div>
      </div>
    </div>
  `;
}

export function buildVerificationEmailTemplate({
  username,
  actionUrl,
}: BaseAuthEmailInput): AuthEmailTemplate {
  return {
    subject: "Verify your Yumo Yumo account",
    html: buildBaseEmailShell({
      eyebrow: "Yumo Yumo Access",
      title: "Confirm your email address",
      body: `Hello ${username}, your account is almost ready. Please confirm this email to complete your profile and continue to the app.`,
      cta: "Verify email",
      actionUrl,
      footer: "If you did not create this account, you can safely ignore this message.",
    }),
  };
}

export function buildPasswordResetEmailTemplate({
  username,
  actionUrl,
}: BaseAuthEmailInput): AuthEmailTemplate {
  return {
    subject: "Reset your Yumo Yumo password",
    html: buildBaseEmailShell({
      eyebrow: "Yumo Yumo Security",
      title: "Set a new password",
      body: `Hello ${username}, we received a request to reset your password. Use the secure button below to set a new one.`,
      cta: "Reset password",
      actionUrl,
      footer: "If you did not request a password reset, you can ignore this email and your current password will stay unchanged.",
    }),
  };
}
