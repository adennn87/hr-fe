'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { SecurityContext } from '@/components/SecurityContext';
import { DEFAULT_SECURITY_CONTEXT, type User } from '@/lib/auth-types';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/dashboard/employees', label: 'Nhân sự' },
  { href: '/dashboard/attendance', label: 'Chấm công' },
  { href: '/dashboard/payroll', label: 'Lương thưởng' },
  { href: '/dashboard/recruitment', label: 'Tuyển dụng' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useMemo<User>(() => {
    if (typeof window === 'undefined') {
      return {
        id: 'guest-001',
        name: 'Guest',
        email: 'guest@hr.com.vn',
        role: 'Employee',
        department: 'General',
        location: 'Hanoi',
        avatar: '',
        mfaEnabled: false,
      };
    }

    const raw = localStorage.getItem('user');

    if (!raw) {
      router.replace('/login');
      return {
        id: 'guest-001',
        name: 'Guest',
        email: 'guest@hr.com.vn',
        role: 'Employee',
        department: 'General',
        location: 'Hanoi',
        avatar: '',
        mfaEnabled: false,
      };
    }

    return JSON.parse(raw) as User;
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
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
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
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