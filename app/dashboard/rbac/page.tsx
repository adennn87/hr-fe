'use client';

import { IAMCore } from '@/components/modules/IAMCore';
import { useStoredUser, GUEST_USER } from '@/lib/use-stored-user';
import { usePermissions } from '@/lib/use-permissions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IAMPage() {
  const user = useStoredUser();
  const router = useRouter();
  const { hasPermission, isAdmin } = usePermissions();

  useEffect(() => {
    if (user === GUEST_USER) {
      router.replace('/login');
      return;
    }
    // Redirect nếu không có quyền ROLE_VIEW và không phải admin
    if (user && !isAdmin && !hasPermission('ROLE_VIEW')) {
      router.replace('/dashboard');
    }
  }, [user, router, isAdmin, hasPermission]);

  // Nếu đang loading user hoặc là khách, trả về loading hoặc null
  if (!user || user === GUEST_USER) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Chặn render nếu không có quyền
  if (!isAdmin && !hasPermission('ROLE_VIEW')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <IAMCore user={user} />;
}