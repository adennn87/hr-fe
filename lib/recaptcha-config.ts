import { toast } from 'sonner';

/** Site key reCAPTCHA v2 (public — client-side use only). */
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export function isRecaptchaConfigured(): boolean {
  return RECAPTCHA_SITE_KEY.length > 0;
}

/**
 * When site key is configured: token from widget is required.
 * - `undefined`: reCAPTCHA not configured → skip check.
 * - `null`: configured but not ticked / missing token (already toasted).
 * - string: valid token.
 */
export function requireRecaptchaToken(getToken: () => string | null): string | null | undefined {
  if (!isRecaptchaConfigured()) return undefined;
  const t = getToken();
  if (!t) {
    toast.error('Please verify reCAPTCHA');
    return null;
  }
  return t;
}
