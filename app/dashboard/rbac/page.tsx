'use client';

import { IAMCore } from '@/components/modules/IAMCore';
import { useStoredUser, GUEST_USER } from '@/lib/use-stored-user';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IAMPage() {
  const user = useStoredUser();
  const router = useRouter();

  // Redirect nếu chưa đăng nhập (tùy chọn)
  useEffect(() => {
    if (user === GUEST_USER) {
      router.replace('/login');
    }
  }, [user, router]);

  // Nếu đang loading user hoặc là khách, trả về loading hoặc null
  if (!user || user === GUEST_USER) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <IAMCore user={user} />;
}