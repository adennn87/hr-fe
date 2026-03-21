// components/auth/types.ts

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

import { Role } from '@/lib/auth-types';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role | string;
  department: string;
  location: string;
  avatar: string;
  mfaEnabled: boolean;
  permissions: string[];
}


export enum Department {
  SelectDepartment = 'Select Department',
  CEO = 'CEO',
  HR = 'HR',
  IT = 'IT',
  Finance = 'Finance',
  Marketing = 'Marketing',
  Sales = 'Sales',
}

export enum Position {
  CEO = 'CEO',
  Manager = 'Manager',
  Employee = 'Employee',
}


