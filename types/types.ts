// components/auth/types.ts

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface UserProfile {
  id: string;
  fullName: string;
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


