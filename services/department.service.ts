import { API_URL } from '@/lib/api';

export interface DepartmentUser {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  citizen_Id?: string | null;
  position?: string | null;
  address?: string | null;
  taxCode?: string | null;
  status?: string | null;
  salaryPerDay?: string | null;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  users: DepartmentUser[];
  createdAt: string;
  updatedAt: string;
}

export const departmentService = {
  /**
   * Lấy danh sách tất cả departments
   * API endpoint: GET /departments
   */
  async getDepartments(): Promise<Department[]> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/departments`, {
      method: 'GET',
      headers: {
        accept: '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },
};
