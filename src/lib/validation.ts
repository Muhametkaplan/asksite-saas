/**
 * Input Validation & Sanitization Helpers
 * Provides runtime type checking and boundary validation for user input data
 */

export interface ValidatedCoupleInput {
  partner1_name: string;
  partner2_name: string;
  subtitle: string;
  whatsapp_number: string;
  spotify_url: string;
}

/**
 * Validates game scores to ensure non-negative, finite integer bounds
 */
export function validateGameScore(rawScore: unknown, maxLimit = 1000000): number {
  if (typeof rawScore !== 'number' || isNaN(rawScore) || !isFinite(rawScore)) {
    const parsed = parseInt(String(rawScore || 0), 10);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(Math.floor(parsed), maxLimit);
  }
  if (rawScore < 0) return 0;
  return Math.min(Math.floor(rawScore), maxLimit);
}

/**
 * Validates slug format (alphanumeric and hyphens only)
 */
export function validateSlug(rawSlug: unknown): string {
  if (typeof rawSlug !== 'string' || !rawSlug.trim()) {
    return 'demo';
  }
  const clean = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return clean || 'demo';
}

/**
 * Validates and sanitizes couple config input fields
 */
export function validateCoupleConfigInput(input: Partial<ValidatedCoupleInput>): ValidatedCoupleInput {
  const sanitizeText = (str?: unknown, fallback = '') => {
    if (typeof str !== 'string') return fallback;
    return str.trim().slice(0, 100);
  };

  const sanitizePhone = (phone?: unknown) => {
    if (typeof phone !== 'string') return '905520000000';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return digits;
    }
    return '905520000000';
  };

  return {
    partner1_name: sanitizeText(input.partner1_name, 'Partner 1'),
    partner2_name: sanitizeText(input.partner2_name, 'Partner 2'),
    subtitle: sanitizeText(input.subtitle, 'Bizim Dünyamız ❤️'),
    whatsapp_number: sanitizePhone(input.whatsapp_number),
    spotify_url: typeof input.spotify_url === 'string' ? input.spotify_url.trim().slice(0, 300) : '',
  };
}
