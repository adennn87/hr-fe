'use client';

import { Login } from '@/components/Login';

export default function RegisterPage() {
  // Reuse Login screen but open register step directly
  return <Login initialStep="register" />;
}