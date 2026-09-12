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
            <td align="center" style="padding: 36px 30px 15px 30px;">
              <img src="https://www.asksite.com.tr/logo.png" alt="AskSite" width="80" height="80" style="border-radius: 20px; border: 1px solid #334155; display: block; margin: 0 auto 10px auto; box-shadow: 0 10px 25px rgba(244, 63, 94, 0.2);" />
              <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">AskSite<span style="color: #ff4d6d;">.</span></div>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #f43f5e; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Hikayeniz, Sizinle...</p>
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

export interface SendOrderSuccessEmailParams {
  to: string;
  partner1Name?: string;
  partner2Name?: string;
  slug: string;
  plan?: 'yearly_standard' | 'yearly_premium' | '1_year' | 'lifetime' | string;
  inviteCode?: string;
  orderId?: string;
}

export async function sendOrderSuccessEmail({
  to,
  partner1Name = 'Sevda',
  partner2Name = 'Mehmet',
  slug,
  plan = 'yearly_standard',
  inviteCode,
  orderId,
}: SendOrderSuccessEmailParams) {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.asksite.com.tr';
  const siteUrl = `${appUrl}/c/${slug}`;
  const dashboardUrl = `${appUrl}/dashboard?slug=${slug}`;
  const planTitle =
    plan === 'yearly_premium' || plan === 'premium' || plan === 'lifetime'
      ? 'Premium VIP 1 Yıllık Aşk Paketi 💎'
      : 'Standart 1 Yıllık Çift Paketi 🌟';

  const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AskSite • Siteniz Hazır!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background: #111827; border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 28px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75);">
          
          <!-- Top Accent Gradient -->
          <tr>
            <td style="background: linear-gradient(90deg, #ff4d6d 0%, #ec4899 50%, #8b5cf6 100%); height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 36px 30px 15px 30px;">
              <img src="https://www.asksite.com.tr/logo.png" alt="AskSite" width="80" height="80" style="border-radius: 20px; border: 1px solid #334155; display: block; margin: 0 auto 10px auto; box-shadow: 0 10px 25px rgba(244, 63, 94, 0.2);" />
              <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">AskSite<span style="color: #ff4d6d;">.</span></div>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #f43f5e; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Hikayeniz, Sizinle...</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 15px 36px 30px 36px; text-align: center;">
              <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 18px;">
                ✨ Siparişiniz Onaylandı • Siteniz Yayında
              </div>

              <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 900; color: #ffffff; line-height: 1.3;">
                Tebrikler, <span style="color: #ff6b8b;">${partner1Name} & ${partner2Name}</span>! 🎉
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Aşkınızı ölümsüzleştiren kişisel çift web siteniz başarıyla kuruldu ve anında yayına alındı!
              </p>

              <!-- Details Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; margin-bottom: 24px; text-align: left;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <div style="margin-bottom: 10px;">
                      <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Paket Türü:</span>
                      <span style="font-size: 13px; color: #f8fafc; font-weight: 700; float: right;">${planTitle}</span>
                    </div>
                    ${orderId ? `
                    <div style="margin-bottom: 10px;">
                      <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Sipariş No:</span>
                      <span style="font-size: 13px; color: #f8fafc; font-weight: 700; float: right;">#${orderId}</span>
                    </div>
                    ` : ''}
                    <div>
                      <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Site Adresiniz:</span>
                      <span style="font-size: 13px; color: #38bdf8; font-weight: 700; float: right;">/c/${slug}</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${inviteCode ? `
              <!-- Invite Code Highlight -->
              <div style="background: linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%); border: 1px dashed rgba(244, 63, 94, 0.4); border-radius: 18px; padding: 18px; margin-bottom: 28px;">
                <div style="font-size: 12px; color: #f43f5e; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  💌 Partner Eşleşme Kodunuz
                </div>
                <div style="font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #ffffff; font-family: monospace;">
                  ${inviteCode}
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
                  Bu kodu sevgilinize göndererek sitenize ortak yönetici olarak ücretsiz bağlanmasını sağlayabilirsiniz.
                </div>
              </div>
              ` : ''}

              <!-- Primary Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 18px auto; width: 100%;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${siteUrl}" target="_blank" style="display: block; width: 85%; max-width: 380px; padding: 15px 24px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 50px; background: linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%); box-shadow: 0 10px 24px rgba(225, 29, 72, 0.4); text-align: center;">
                      💖 Aşk Sitenize Git
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" style="display: block; width: 85%; max-width: 380px; padding: 13px 24px; font-size: 14px; font-weight: 700; color: #cbd5e1; text-decoration: none; border-radius: 50px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); text-align: center;">
                      ⚙️ Yönetim Paneline Giriş Yap
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Pro Tips -->
              <div style="text-align: left; background: rgba(255, 255, 255, 0.02); border-radius: 14px; padding: 16px; margin-top: 26px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #e2e8f0;">Neler Yapabilirsiniz?</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  <li>Fotoğraflarınızı ve anılarınızı yükleyin</li>
                  <li>İlk tanışma tarihinizi ve canlı sayacı ayarlayın</li>
                  <li>Spotify aşk çalma listenizi ekleyin</li>
                  <li>Romantik aşk haritanıza gezdiğiniz yerleri işaretleyin</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 22px 36px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                Sorularınız mı var? Destek: <a href="mailto:asksitesaas@gmail.com" style="color: #ff6b8b; text-decoration: none;">asksitesaas@gmail.com</a> | WhatsApp: <a href="https://wa.me/905524185530" style="color: #ff6b8b; text-decoration: none;">+90 552 418 55 30</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © 2026 AskSite • Tüm Hakları Saklıdır. Aşkla tasarlandı.
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

  try {
    const info = await transporter.sendMail({
      from: `"AskSite • Aşk Platformu" <${user}>`,
      to,
      subject: `Tebrikler! ${partner1Name} & ${partner2Name} Özel Aşk Siteniz Hazır 🎉💖`,
      html: htmlContent,
    });
    console.log(`[Order Success Mail Sent] To: ${to}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Order Success Mail Error]:', err);
    return { success: false, error: err };
  }
}

export interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  resetLink: string;
}

export async function sendPasswordResetEmailTemplate({
  to,
  name,
  resetLink,
}: SendPasswordResetEmailParams) {
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
  <title>AskSite • Şifre Sıfırlama</title>
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
            <td align="center" style="padding: 36px 30px 15px 30px;">
              <img src="https://www.asksite.com.tr/logo.png" alt="AskSite" width="80" height="80" style="border-radius: 20px; border: 1px solid #334155; display: block; margin: 0 auto 10px auto; box-shadow: 0 10px 25px rgba(244, 63, 94, 0.2);" />
              <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">AskSite<span style="color: #ff4d6d;">.</span></div>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #f43f5e; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Hikayeniz, Sizinle...</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 36px 30px 36px; text-align: center;">
              <div style="display: inline-block; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 50px; padding: 6px 18px; margin-bottom: 18px;">
                <span style="font-size: 12px; font-weight: 800; color: #ff6b8b; text-transform: uppercase; letter-spacing: 1px;">🔐 Şifre Sıfırlama Talebi</span>
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35;">
                Merhaba, <span style="color: #ff6b8b;">${displayName}</span>!
              </h1>
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                AskSite hesabınız için bir şifre yenileme talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi güvenle belirleyebilirsiniz:
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 50px; background: linear-gradient(135deg, #ff4d6d 0%, #e11d48 100%); box-shadow: 0 12px 26px rgba(225, 29, 72, 0.45);">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 50px; letter-spacing: 0.3px;">
                      Yeni Şifremi Belirle 🔒
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Warning Box -->
              <div style="margin-top: 24px; padding: 16px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 14px; text-align: left;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #fca5a5;">
                  ⚠️ Bu talebi siz yapmadıysanız:
                </p>
                <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                  Hiçbir işlem yapmanıza gerek yoktur. Hesabınız tamamen güvendedir ve mevcut şifreniz değişmemiştir. Bu bağlantı güvenlik nedeniyle sınırlı süre için geçerlidir.
                </p>
              </div>

              <!-- Fallback Link Notice -->
              <div style="margin-top: 20px; padding: 14px; background: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(255, 255, 255, 0.12); border-radius: 14px; text-align: left;">
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                  Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınızın adres çubuğuna yapıştırabilirsiniz:
                </p>
                <p style="margin: 0; font-size: 11px; word-break: break-all; color: #38bdf8; font-family: monospace;">
                  <a href="${resetLink}" target="_blank" style="color: #38bdf8; text-decoration: none;">${resetLink}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background: rgba(0, 0, 0, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                Destek: <a href="mailto:asksitesaas@gmail.com" style="color: #ff6b8b; text-decoration: none;">asksitesaas@gmail.com</a>
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

  try {
    const info = await transporter.sendMail({
      from: `"AskSite • Aşk Platformu" <${user}>`,
      to,
      subject: 'AskSite • Şifre Sıfırlama Talebiniz 🔐',
      html: htmlContent,
    });
    console.log(`[Password Reset Mail Sent] To: ${to}, MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Password Reset Mail Error]:', err);
    return { success: false, error: err };
  }
}

