'use client';

import { Login } from '@/components/Login';

export default function RegisterPage() {
  // Tái sử dụng màn Login nhưng mở thẳng step đăng ký
  return <Login initialStep="register" />;
}