import { toast } from 'sonner';

/** Site key reCAPTCHA v2 (public — chỉ dùng phía client). */
export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export function isRecaptchaConfigured(): boolean {
  return RECAPTCHA_SITE_KEY.length > 0;
}

/**
 * Khi đã cấu hình site key: bắt buộc có token từ widget.
 * - `undefined`: chưa cấu hình reCAPTCHA → bỏ qua kiểm tra.
 * - `null`: đã cấu hình nhưng chưa tick / thiếu token (đã toast).
 * - string: token hợp lệ.
 */
export function requireRecaptchaToken(getToken: () => string | null): string | null | undefined {
  if (!isRecaptchaConfigured()) return undefined;
  const t = getToken();
  if (!t) {
    toast.error('Vui lòng xác nhận reCAPTCHA');
    return null;
  }
  return t;
}
