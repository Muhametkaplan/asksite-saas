/**
 * SMS Notification Engine for Aşk Dünyamız
 * Supports Netgsm (TR), Twilio, and automated simulation mode for development/testing.
 */

export interface SmsSendResult {
  success: boolean;
  provider: 'netgsm' | 'twilio' | 'simulation';
  messageId?: string;
  phone: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Format Turkish phone numbers into standard E.164 or 10-digit format
 */
export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '90' + cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    return '90' + cleaned;
  }
  return cleaned;
}

export async function sendSmsReminder({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<SmsSendResult> {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized || sanitized.length < 10) {
    return {
      success: false,
      provider: 'simulation',
      phone,
      error: 'Geçersiz telefon numarası formatı.',
    };
  }

  // 1. Check Netgsm credentials
  const netgsmUser = process.env.NETGSM_USER;
  const netgsmPassword = process.env.NETGSM_PASSWORD;
  const netgsmHeader = process.env.NETGSM_HEADER || 'ASKSITE';

  if (netgsmUser && netgsmPassword) {
    try {
      const netgsmUrl = 'https://api.netgsm.com.tr/sms/send/get';
      const targetPhone = sanitized.startsWith('90') ? sanitized.slice(2) : sanitized;
      const params = new URLSearchParams({
        usercode: netgsmUser,
        password: netgsmPassword,
        gsmno: targetPhone,
        message: message,
        msgheader: netgsmHeader,
      });

      const response = await fetch(`${netgsmUrl}?${params.toString()}`);
      const text = await response.text();

      // Netgsm returns 00 or 01 or 02 on success followed by job ID
      if (text.startsWith('00') || text.startsWith('01') || text.startsWith('02')) {
        return {
          success: true,
          provider: 'netgsm',
          messageId: text.trim(),
          phone: sanitized,
        };
      } else {
        console.warn(`[SMS/Netgsm] Error response: ${text}`);
        return {
          success: false,
          provider: 'netgsm',
          phone: sanitized,
          error: `Netgsm hata kodu: ${text}`,
        };
      }
    } catch (err: any) {
      console.error('[SMS/Netgsm] Network error:', err);
      return {
        success: false,
        provider: 'netgsm',
        phone: sanitized,
        error: err?.message || 'Netgsm ağ hatası',
      };
    }
  }

  // 2. Check Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `+${sanitized}`,
            From: twilioFrom,
            Body: message,
          }),
        }
      );

      const json = await response.json();
      if (response.ok) {
        return {
          success: true,
          provider: 'twilio',
          messageId: json.sid,
          phone: sanitized,
        };
      } else {
        return {
          success: false,
          provider: 'twilio',
          phone: sanitized,
          error: json.message || 'Twilio gönderim hatası',
        };
      }
    } catch (err: any) {
      console.error('[SMS/Twilio] Network error:', err);
      return {
        success: false,
        provider: 'twilio',
        phone: sanitized,
        error: err?.message || 'Twilio ağ hatası',
      };
    }
  }

  // 3. Fallback to Simulation Mode for Test / Dev environments
  console.log(`[SMS/Simulated] SMS Başarıyla Simüle Edildi -> Alıcı: ${sanitized}`);
  console.log(`[SMS/Simulated] Mesaj: "${message}"`);

  return {
    success: true,
    provider: 'simulation',
    phone: sanitized,
    messageId: `sim_${Date.now()}`,
    simulated: true,
  };
}
