/** Inline HTML/CSS for email clients (table layout, no external CSS). */

export function buildOtpEmail(params: {
  code: string;
  purpose: 'REGISTER' | 'LOGIN';
  brandName: string;
  year: number;
}): { subject: string; html: string } {
  const isRegister = params.purpose === 'REGISTER';
  const headline = isRegister ? 'Verify your new account' : 'Confirm it’s you';
  const lead = isRegister
    ? `You’re almost done. Enter this code in ${params.brandName} to finish creating your account.`
    : `We received a sign-in attempt for your account. Enter this code to continue. If you didn’t try to sign in, you can ignore this email.`;

  const subject = isRegister
    ? `${params.brandName}: Your verification code is ${params.code}`
    : `${params.brandName}: Your sign-in code is ${params.code}`;

  const codeHtml = params.code
    .split('')
    .map(
      (d) =>
        `<td style="font-family:ui-monospace,Consolas,monospace;font-size:28px;font-weight:700;color:#0f172a;padding:12px 14px;border-radius:10px;background:#f1f5f9;border:1px solid #e2e8f0;">${d}</td>`,
    )
    .join('<td style="width:8px;"></td>');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:28px 32px 8px 32px;background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.9);">${params.brandName}</p>
              <h1 style="margin:12px 0 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${lead}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Your 6-digit code</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>${codeHtml}</tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.55;color:#64748b;">This code expires in <strong style="color:#0f172a;">10 minutes</strong>. Do not share it with anyone. ${params.brandName} will never ask you for this code by phone or on social media.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:20px 0 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">You received this message because a verification was requested for this email address. If this wasn’t you, you can safely ignore this email.</p>
              <p style="margin:16px 0 0 0;font-size:11px;color:#cbd5e1;">© ${params.year} ${params.brandName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
