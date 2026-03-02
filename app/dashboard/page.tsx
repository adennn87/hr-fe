'use client';

import { Dashboard } from '@/components/Dashboard';
import { DEFAULT_SECURITY_CONTEXT, type User } from '@/lib/auth-types';

function getCurrentUser(): User {
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

  const user = localStorage.getItem('user');
  if (!user) {
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

  return JSON.parse(user) as User;
}

export default function DashboardPage() {
  const user = getCurrentUser();

  return <Dashboard user={user} securityContext={DEFAULT_SECURITY_CONTEXT} />;
}