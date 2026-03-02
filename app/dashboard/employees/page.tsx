'use client';

import { CoreHR } from '@/components/modules/CoreHR';
import type { User } from '@/lib/auth-types';

const fallbackUser: User = {
  id: 'u-003',
  name: 'John Doe',
  email: 'employee@hr.com.vn',
  role: 'Employee',
  department: 'Sales',
  location: 'Da Nang',
  avatar: '',
  mfaEnabled: true,
};

export default function EmployeesPage() {
  const user = typeof window === 'undefined' ? fallbackUser : JSON.parse(localStorage.getItem('user') || JSON.stringify(fallbackUser));
  return <CoreHR user={user} />;
}