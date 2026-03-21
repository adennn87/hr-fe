'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@/lib/auth-types';

export const GUEST_USER: User = {
  id: 'guest-001',
  fullName: 'Guest',
  email: 'guest@hr.com.vn',
  role: 'Employee',
  department: 'General',
  location: 'Hanoi',
  avatar: '',
  mfaEnabled: false,
  permissions: [],
};

let cachedRawUser: string | null | undefined;
let cachedUser: User = GUEST_USER;

const normalizeStoredUser = (rawUser: any): User => {
  const fullName =
    (rawUser?.fullName || rawUser?.full_name || rawUser?.name || '').toString().trim();

  return {
    id: rawUser?.id || GUEST_USER.id,
    fullName: fullName || GUEST_USER.fullName,
    email: rawUser?.email || GUEST_USER.email,
    role: rawUser?.role || GUEST_USER.role,
    department: rawUser?.department || GUEST_USER.department,
    location: rawUser?.location || GUEST_USER.location,
    avatar: rawUser?.avatar || '',
    mfaEnabled: Boolean(rawUser?.mfaEnabled),
    taxCode: rawUser?.taxCode,
    permissions: Array.isArray(rawUser?.permissions) ? rawUser.permissions : [],
  };
};

function readUserSnapshot(): User {
  if (typeof window === 'undefined') {
    return GUEST_USER;
  }

  // Ưu tiên đọc từ sessionStorage, nếu không có thì đọc từ localStorage
  const raw = window.sessionStorage.getItem('user') || window.localStorage.getItem('user');

  if (raw === cachedRawUser) {
    return cachedUser;
  }

  cachedRawUser = raw;

  if (!raw) {
    cachedUser = GUEST_USER;
    return cachedUser;
  }

  try {
    cachedUser = normalizeStoredUser(JSON.parse(raw));
  } catch {
    cachedUser = GUEST_USER;
  }

  return cachedUser;
}

function subscribeToUserStore(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

export function useStoredUser(): User {
  return useSyncExternalStore(subscribeToUserStore, readUserSnapshot, () => GUEST_USER);
}