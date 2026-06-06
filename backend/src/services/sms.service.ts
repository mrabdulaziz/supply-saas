import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Eskiz.uz SMS service for Uzbekistan
 * Docs: https://eskiz.uz/api
 */

let eskizToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getEskizToken(): Promise<string> {
  // Return cached token if still valid (buffer 5min)
  if (eskizToken && tokenExpiry && tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
    return eskizToken;
  }

  const res = await axios.post('https://notify.eskiz.uz/api/auth/login', {
    email: env.ESKIZ_EMAIL,
    password: env.ESKIZ_PASSWORD,
  });

  eskizToken = res.data.data.token;
  // Tokens expire in 30 days, cache for 29 days
  tokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
  return eskizToken!;
}

export const smsService = {
  async send(phone: string, message: string): Promise<void> {
    // In development, just log the OTP instead of sending
    if (env.NODE_ENV === 'development') {
      logger.info(`[DEV SMS] To: ${phone} | Message: ${message}`);
      return;
    }

    if (!env.ESKIZ_EMAIL || !env.ESKIZ_PASSWORD) {
      logger.warn('Eskiz credentials not set — skipping SMS send');
      return;
    }

    try {
      const token = await getEskizToken();
      // Remove the + from phone number for Eskiz
      const mobile_phone = phone.replace('+', '');

      await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        {
          mobile_phone,
          message,
          from: env.ESKIZ_FROM,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      logger.info(`SMS sent to ${phone}`);
    } catch (err) {
      logger.error('SMS send failed', err);
      // Don't throw — SMS failure shouldn't crash the request
      // In production, you'd queue a retry here
    }
  },
};
