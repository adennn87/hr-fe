'use client';

import { TimeAttendance } from '@/components/modules/TimeAttendance';
import type { User } from '@/lib/auth-types';

const fallbackUser: User = {
  id: 'u-003',
  fullName: 'John Doe',
  email: 'employee@hr.com.vn',
  role: 'Employee',
  department: 'Sales',
  location: 'Da Nang',
  avatar: '',
  mfaEnabled: true,
};

export default function AttendancePage() {
  const user = typeof window === 'undefined' ? fallbackUser : JSON.parse(localStorage.getItem('user') || JSON.stringify(fallbackUser));
  return <TimeAttendance user={user} />;
}