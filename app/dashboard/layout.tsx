'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { SecurityContext } from '@/components/SecurityContext';
import { DEFAULT_SECURITY_CONTEXT } from '@/lib/auth-types';
import { GUEST_USER, useStoredUser } from '@/lib/use-stored-user';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/dashboard/rbac', label: 'Vai trò' },
  { href: '/dashboard/employees', label: 'Nhân sự' },
  { href: '/dashboard/attendance', label: 'Lịch làm việc' },
  { href: '/dashboard/payroll', label: 'Lương thưởng' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useStoredUser();

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
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
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