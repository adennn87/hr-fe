'use client';

import { useEffect, useState } from 'react';
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
  permissions: [],
};

function readUserFromStorage(): User {
  if (typeof window === 'undefined') return fallbackUser;
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw) as User;
  } catch {
    /* ignore */
  }
  return fallbackUser;
}

export default function AttendancePage() {
  /** Constant mount + stable reference — prevents JSON.parse on every render that causes children to remount (popovers/modals closing automatically). */
  const [user, setUser] = useState<User>(fallbackUser);

  useEffect(() => {
    setUser(readUserFromStorage());
  }, []);

  return <TimeAttendance user={user} />;
}