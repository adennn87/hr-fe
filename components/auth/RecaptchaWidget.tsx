'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { default as ReCAPTCHAComponent } from 'react-google-recaptcha';
import { isRecaptchaConfigured, RECAPTCHA_SITE_KEY } from '@/lib/recaptcha-config';

export type RecaptchaHandle = {
  getToken: () => string | null;
  reset: () => void;
};

type RecaptchaWidgetProps = {
  className?: string;
};

/**
 * reCAPTCHA v2 checkbox.
 * - If NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set → show Google widget.
 * - If no key → show configuration suggestion (form still works, tick not required).
 */
export const RecaptchaWidget = forwardRef<RecaptchaHandle, RecaptchaWidgetProps>(
  function RecaptchaWidget({ className }, ref) {
    const [Captcha, setCaptcha] = useState<typeof ReCAPTCHAComponent | null>(null);
    const innerRef = useRef<import('react-google-recaptcha').ReCAPTCHAInstance | null>(null);

    useEffect(() => {
      if (!isRecaptchaConfigured()) return;
      void import('react-google-recaptcha').then((m) => {
        setCaptcha(() => m.default);
      });
    }, []);

    useImperativeHandle(ref, () => ({
      getToken: () => innerRef.current?.getValue() ?? null,
      reset: () => innerRef.current?.reset(),
    }));

    if (!isRecaptchaConfigured()) {
      return (
        <div
          className={`rounded-lg border border-dashed border-amber-200 bg-amber-50/80 px-3 py-2.5 text-center ${className ?? ''}`}
          role="status"
          aria-label="reCAPTCHA not configured"
        >
          <p className="text-xs font-medium text-amber-900">reCAPTCHA not enabled</p>
          <p className="mt-1 text-[11px] leading-snug text-amber-800/90">
            Add to <code className="rounded bg-amber-100/80 px-1 font-mono">.env.local</code> in the root directory:
          </p>
          <code className="mt-1.5 block break-all rounded bg-white/80 px-2 py-1 text-left text-[10px] text-slate-700">
            NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
          </code>
          <p className="mt-1.5 text-[11px] text-amber-800/90">
            Get key at{' '}
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              Google reCAPTCHA
            </a>{' '}
            (v2). Add <strong>localhost</strong> to domains. Then <strong>restart</strong>{' '}
            <code className="rounded bg-amber-100/80 px-0.5">yarn dev</code>.
          </p>
        </div>
      );
    }

    if (!Captcha) {
      return (
        <div
          className={`flex min-h-[78px] items-center justify-center text-xs text-slate-500 ${className ?? ''}`}
        >
          Loading reCAPTCHA...
        </div>
      );
    }

    return (
      <div className={`flex justify-center overflow-x-auto ${className ?? ''}`}>
        <Captcha ref={innerRef} sitekey={RECAPTCHA_SITE_KEY} />
      </div>
    );
  },
);
