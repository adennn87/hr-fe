// components/auth/types.ts

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  location: string;
  avatar: string;
  mfaEnabled: boolean;
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

export const MOCK_USERS: Record<string, UserProfile> = {
  'admin@hr.com.vn': {
    id: 'u-001', name: 'System Admin', email: 'admin@hr.com.vn', role: 'System Admin',
    department: 'IT Security', location: 'Hanoi', avatar: '', mfaEnabled: true
  },
  '0912345678': {
    id: 'u-003', name: 'John Doe', email: 'employee@hr.com.vn', role: 'Employee',
    department: 'Sales', location: 'Da Nang', avatar: '', mfaEnabled: true
  }
};
