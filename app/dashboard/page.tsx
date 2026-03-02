'use client';

import { useSyncExternalStore } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { DEFAULT_SECURITY_CONTEXT } from '@/lib/auth-types';
import { useStoredUser } from '@/lib/use-stored-user';

export default function DashboardPage() {

  const user = useStoredUser();

  return <Dashboard user={user} securityContext={DEFAULT_SECURITY_CONTEXT} />;
}