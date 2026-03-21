'use client';

import { CoreHR } from '@/components/modules/CoreHR';
import { useStoredUser } from '@/lib/use-stored-user';

export default function AssetsPage() {
  const user = useStoredUser();
  return <CoreHR user={user} defaultTab="assets" />;
}
