'use client';

import { CoreHR } from '@/components/modules/CoreHR';
import { useStoredUser } from '@/lib/use-stored-user';
import { usePermissions } from '@/lib/use-permissions';

export default function DepartmentsPage() {
  const user = useStoredUser();
  const { hasPermission, isAdmin } = usePermissions();
  const canViewOrg = isAdmin || hasPermission('USER_VIEW');
  return <CoreHR user={user} defaultTab={canViewOrg ? 'orgchart' : 'profile'} />;
}
