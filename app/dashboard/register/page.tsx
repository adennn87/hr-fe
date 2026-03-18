'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function DashboardRegisterPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <RegisterForm onBack={() => router.push('/dashboard')} />
    </div>
  );
}

