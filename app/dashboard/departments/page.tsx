'use client';

import { CoreHR } from '@/components/modules/CoreHR';
import { useStoredUser } from '@/lib/use-stored-user';

export default function DepartmentsPage() {
  const user = useStoredUser();
  return <CoreHR user={user} defaultTab="orgchart" />;
}
