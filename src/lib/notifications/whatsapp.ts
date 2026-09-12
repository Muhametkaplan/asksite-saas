/**
 * WhatsApp Notification Engine for Aşk Dünyamız
 * Supports Meta WhatsApp Cloud API, Twilio WhatsApp API, and simulated mode.
 */

import { sanitizePhoneNumber } from './sms';

export interface WhatsAppSendResult {
  success: boolean;
  provider: 'meta_cloud' | 'twilio' | 'simulation';
  messageId?: string;
  phone: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Generate a direct WhatsApp Web/App click-to-chat URL
 */
export function getDirectWhatsAppUrl(phone: string, message: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

/**
 * Send an automated WhatsApp notification to a couple partner
 */
export async function sendWhatsAppReminder({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<WhatsAppSendResult> {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized || sanitized.length < 10) {
    return {
      success: false,
      provider: 'simulation',
      phone,
      error: 'Geçersiz telefon numarası formatı.',
    };
  }

  // 1. Meta WhatsApp Cloud API
  const cloudPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const cloudAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (cloudPhoneNumberId && cloudAccessToken) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${cloudPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cloudAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: sanitized,
            type: 'text',
            text: {
              preview_url: true,
              body: message,
            },
          }),
        }
      );

      const json = await response.json();
      if (response.ok && json.messages?.[0]?.id) {
        return {
          success: true,
          provider: 'meta_cloud',
          messageId: json.messages[0].id,
          phone: sanitized,
        };
      } else {
        console.warn('[WhatsApp/Meta] Error:', json);
        return {
          success: false,
          provider: 'meta_cloud',
          phone: sanitized,
          error: json.error?.message || 'Meta WhatsApp gönderim hatası',
        };
      }
    } catch (err: any) {
      console.error('[WhatsApp/Meta] Network error:', err);
      return {
        success: false,
        provider: 'meta_cloud',
        phone: sanitized,
        error: err?.message || 'WhatsApp Cloud ağ hatası',
      };
    }
  }

  // 2. Twilio WhatsApp API
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (twilioSid && twilioAuthToken) {
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
            To: `whatsapp:+${sanitized}`,
            From: twilioWhatsAppFrom.startsWith('whatsapp:')
              ? twilioWhatsAppFrom
              : `whatsapp:${twilioWhatsAppFrom}`,
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
          error: json.message || 'Twilio WhatsApp gönderim hatası',
        };
      }
    } catch (err: any) {
      console.error('[WhatsApp/Twilio] Network error:', err);
      return {
        success: false,
        provider: 'twilio',
        phone: sanitized,
        error: err?.message || 'Twilio WhatsApp ağ hatası',
      };
    }
  }

  // 3. Fallback to Simulation Mode
  console.log(`[WhatsApp/Simulated] WhatsApp Bildirimi Başarıyla Simüle Edildi -> Alıcı: ${sanitized}`);
  console.log(`[WhatsApp/Simulated] Mesaj: "${message}"`);

  return {
    success: true,
    provider: 'simulation',
    phone: sanitized,
    messageId: `wa_sim_${Date.now()}`,
    simulated: true,
  };
}
