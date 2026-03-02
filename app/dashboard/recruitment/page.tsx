'use client';

import { ATS } from '@/components/modules/ATS';
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

export default function RecruitmentPage() {
  const user = typeof window === 'undefined' ? fallbackUser : JSON.parse(localStorage.getItem('user') || JSON.stringify(fallbackUser));
  return <ATS user={user} />;
}