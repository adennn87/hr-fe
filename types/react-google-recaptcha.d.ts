declare module 'react-google-recaptcha' {
  import type * as React from 'react';

  export interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal' | 'invisible';
  }

  export interface ReCAPTCHAInstance {
    getValue: () => string | null;
    reset: () => void;
  }

  const ReCAPTCHA: React.ForwardRefExoticComponent<
    ReCAPTCHAProps & React.RefAttributes<ReCAPTCHAInstance>
  >;

  export default ReCAPTCHA;
}
