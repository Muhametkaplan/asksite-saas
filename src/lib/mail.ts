import nodemailer from 'nodemailer';

export interface SendVerificationEmailParams {
  to: string;
  name?: string;
  verificationLink: string;
}

export async function sendVerificationEmail({ to, name, verificationLink }: SendVerificationEmailParams) {
  function cleanString(val?: string): string {
    if (!val) return '';
    let clean = val.trim();
    while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    return clean;
  }

  const rawUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'asksitesaas@gmail.com';
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  const user = cleanString(rawUser);
  const pass = cleanString(rawPass).replace(/\s+/g, '');

  if (!pass) {
    console.warn('[Mail] No SMTP / Gmail App Password configured in environment variables.');
    return { success: false, reason: 'NO_SMTP_CONFIGURED' };
  }

  // Use service: 'gmail' for best cloud/serverless compatibility, or custom SMTP host if provided
  const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT,
        auth: { user, pass },
      })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });

  const displayName = name || to.split('@')[0] || 'Değerli Kullanıcımız';

  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AskSite • E-Posta Doğrulama</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background: #111827; border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 28px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Accent Gradient -->
          <tr>
            <td style="background: linear-gradient(90deg, #ff4d6d 0%, #f43f5e 50%, #8b5cf6 100%); height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Brand Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 15px 30px;">
              <div style="display: inline-block; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 24px; padding: 10px 24px;">
                <span style="font-size: 24px; vertical-align: middle;">💖</span>
                <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; vertical-align: middle; margin-left: 8px;">AskSite<span style="color: #ff4d6d;">.</span></span>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Aşkınızı Dijitalde Ölümsüzleştirin</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 36px 30px 36px; text-align: center;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35;">
                Aramıza Hoş Geldiniz, <span style="color: #ff6b8b;">${displayName}</span>! ✨
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                AskSite'ta özel çift sayfanızı oluşturmaya ve sevgilinize unutulmaz bir sürpriz hazırlamaya yalnızca bir adım kaldı.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 14px; line-height: 1.5; color: #94a3b8;">
                Hesabınızı aktifleştirmek ve çift panelinize erişmek için aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 50px; background: linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%); box-shadow: 0 12px 26px rgba(225, 29, 72, 0.45);">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 16px 38px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 50px; letter-spacing: 0.3px;">
                      E-Posta Adresimi Doğrula 💌
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link Notice -->
              <div style="margin-top: 36px; padding: 16px; background: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 14px; text-align: left;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  🔒 <strong>Buton çalışmıyor mu?</strong> Doğrulama için aşağıdaki bağlantıyı tarayıcınızın adres çubuğuna yapıştırabilirsiniz:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #38bdf8; font-family: monospace;">
                  <a href="${verificationLink}" target="_blank" style="color: #38bdf8; text-decoration: none;">${verificationLink}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                Bu hesabı siz oluşturmadıysanız, bu e-postayı güvenle silebilirsiniz.
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                Destek: <a href="mailto:asksitesaas@gmail.com" style="color: #ff6b8b; text-decoration: none;">asksitesaas@gmail.com</a> | WhatsApp: <a href="https://wa.me/905524185530" style="color: #ff6b8b; text-decoration: none;">+90 552 418 55 30</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 AskSite • Şahinbey / Gaziantep, Türkiye • Tüm Hakları Saklıdır.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const info = await transporter.sendMail({
    from: `"AskSite • Aşk Platformu" <${user}>`,
    to,
    subject: 'AskSite • E-Posta Adresinizi Doğrulayın 💖',
    html: htmlContent,
  });

  return { success: true, messageId: info.messageId };
}
