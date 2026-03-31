'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { SecurityContext } from '@/components/SecurityContext';
import { DEFAULT_SECURITY_CONTEXT } from '@/lib/auth-types';
import { GUEST_USER, useStoredUser } from '@/lib/use-stored-user';
import { usePermissions } from '@/lib/use-permissions';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/employees', label: 'Employees', module: 'USER' },
  { href: '/dashboard/rbac', label: 'Roles', module: 'ROLE', permission: 'ROLE_VIEW' },
  { href: '/dashboard/attendance', label: 'Work Schedule', module: 'WEEKLY_SCHEDULE' },
  // { href: '/dashboard/timekeeping', label: 'Timekeeping', module: 'TIMEKEEPING' },
  { href: '/dashboard/departments', label: 'Departments', module: 'DEPARTMENT' },
  { href: '/dashboard/assets', label: 'Assets', module: 'ASSET' },
  { href: '/dashboard/asset-management', label: 'Asset Allocation', module: 'ASSET_ALLOCATE', permission: 'ASSET_VIEW' },
  // { href: '/dashboard/leave-requests', label: 'Leave Requests', module: 'LEAVE_REQUEST' },
  // { href: '/dashboard/rbac', label: 'Access Manager', module: 'FUNCTION' },
  { href: '/dashboard/payroll', label: 'Payroll', module: 'PAYROLL' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStoredUser();
  const { hasModuleAccess, hasPermission, isAdmin } = usePermissions();

  const filteredNavItems = navItems.filter(item => {
    if (!item.module) return true;
    // If there is a specific permission, check it instead of the module
    if (item.permission) return hasPermission(item.permission);
    return hasModuleAccess(item.module);
  });

  useEffect(() => {
    if (user === GUEST_USER) {
      router.replace('/login');
    }
  }, [router, user]);

  const onLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    // Clear sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');

    // Clear cookie
    document.cookie = 'access_token=; path=/; max-age=0';
    router.push('/login');
  };

  if (pathname.startsWith('/dashboard/asset-management') && !isAdmin && !hasPermission('ASSET_VIEW')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SecurityContext context={DEFAULT_SECURITY_CONTEXT} user={user} onLogout={onLogout} />
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <nav className="mb-6 flex flex-wrap gap-2">
          {filteredNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}