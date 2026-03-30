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

export interface RoleOption {
  id: string;
  name: string;
}

export interface RoleFunction {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  functionIds: string[];
}

export interface RoleDetailFunction {
  id: string;
  roleCount: number;
  function: RoleFunction;
  createdAt: string;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string;
  roleFunctions: RoleDetailFunction[];
  users: any[]; // Can be more specific if needed
  createdAt: string;
  updatedAt: string;
}

export const roleService = {
  /**
   * Get list of roles and users belonging to each role
   * API: GET /roles/listUserRole (without /api prefix)
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

    // Normalize data, flatten department.name to string and map full_name -> fullName
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

  /**
   * Get role list (id + name) to use for role selection dropdown when creating account.
   * Leverage /roles/listUserRole endpoint (already available), only take id + name.
   */
  async getRoleOptions(): Promise<RoleOption[]> {
    const roles = await this.getRolesWithUsers();
    return (roles || []).map((r) => ({ id: r.id, name: r.name }));
  },

  /**
   * Get list of functions (permissions)
   * API: GET /roles/listFuncions
   */
  async getFunctions(): Promise<RoleFunction[]> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/roles/listFuncions`, {
      method: 'GET',
      headers: {
        accept: '*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Create new role
   * API: POST /roles
   */
  async createRole(data: CreateRoleRequest): Promise<any> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/roles`, {
      method: 'POST',
      headers: {
        accept: '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Get role details (including functions and users)
   * API: GET /roles/:id
   */
  async getRoleDetail(id: string): Promise<RoleDetail> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/roles/${id}`, {
      method: 'GET',
      headers: {
        accept: '*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Update role
   * API: PATCH /roles/:id
   */
  async updateRole(id: string, data: CreateRoleRequest): Promise<any> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/roles/${id}`, {
      method: 'PATCH',
      headers: {
        accept: '*',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  },
};

