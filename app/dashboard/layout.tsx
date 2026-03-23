'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { SecurityContext } from '@/components/SecurityContext';
import { DEFAULT_SECURITY_CONTEXT } from '@/lib/auth-types';
import { GUEST_USER, useStoredUser } from '@/lib/use-stored-user';
import { usePermissions } from '@/lib/use-permissions';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/dashboard/employees', label: 'Nhân sự', module: 'USER' },
  { href: '/dashboard/rbac', label: 'Vai trò', module: 'ROLE' },
  { href: '/dashboard/attendance', label: 'Lịch làm việc', module: 'WEEKLY_SCHEDULE' },
  // { href: '/dashboard/timekeeping', label: 'Chấm công', module: 'TIMEKEEPING' },
  { href: '/dashboard/departments', label: 'Phòng ban', module: 'DEPARTMENT' },
  { href: '/dashboard/assets', label: 'Tài sản', module: 'ASSET' },
  { href: '/dashboard/asset-management', label: 'Quản lý cấp phát', module: 'ASSET_ALLOCATE' },
  // { href: '/dashboard/leave-requests', label: 'Nghỉ phép', module: 'LEAVE_REQUEST' },
  // { href: '/dashboard/rbac', label: 'Access Manager', module: 'FUNCTION' },
  { href: '/dashboard/payroll', label: 'Lương thưởng', module: 'PAYROLL' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStoredUser();
  const { hasModuleAccess } = usePermissions();

  const filteredNavItems = navItems.filter(item => {
    if (!item.module) return true;
    return hasModuleAccess(item.module);
  });

  useEffect(() => {
    if (user === GUEST_USER) {
      router.replace('/login');
    }
  }, [router, user]);

  const onLogout = () => {
    // Xóa localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    // Xóa sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');

    // Xóa cookie
    document.cookie = 'access_token=; path=/; max-age=0';
    router.push('/login');
  };

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