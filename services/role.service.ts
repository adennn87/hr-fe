import { API_URL } from '@/lib/api';
import type { Employee } from '@/services/employee.service';

export interface RoleUserDepartment {
  id: string;
  name: string;
}

export interface RoleUser {
  id: string;
  fullName: string;
  email: string;
  department: string | null | RoleUserDepartment;
}

export interface RoleWithUsers {
  id: string;
  name: string;
  users: RoleUser[];
}

export const roleService = {
  /**
   * Lấy danh sách role và user thuộc từng role
   * API: GET /roles/listUserRole (không có /api prefix)
   */
  async getRolesWithUsers(): Promise<RoleWithUsers[]> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/roles/listUserRole`, {
      method: 'GET',
      headers: {
        accept: '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();

    // Chuẩn hoá dữ liệu, flatten department.name thành string và map full_name -> fullName
    return (data as any[]).map((role) => ({
      id: role.id,
      name: role.name,
      users: (role.users || []).map((user: any) => ({
        id: user.id,
        fullName: user.fullName || user.full_name || '',
        email: user.email,
        department:
          user.department && typeof user.department === 'object'
            ? user.department.name
            : user.department ?? null,
      })),
    }));
  },
};

