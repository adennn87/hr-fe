import { API_URL } from '@/lib/api';

// Định nghĩa types cho Employee - khớp với API response
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  password?: string; // Chỉ có trong response, không dùng để hiển thị
  isActive: boolean;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  citizen_Id?: string | null;
  department?: string | null | {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
  departmentCode?: string | null; // Flatten từ department object
  position?: string | null;
  address?: string | null;
  taxCode?: string | null;
  status?: string | null;
  role?: string | null | {
    id: string;
    name: string;
    description?: string;
  };
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  parentId?: string;
  employeeCount?: number;
  level?: number;
}

export const employeeService = {
  /**
   * Lấy danh sách employees theo department
   * API endpoint: GET /users/group-by-department
   */
  async getEmployeesByDepartment(): Promise<Array<{
    department: string;
    users: Employee[];
  }>> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users/group-by-department`, {
      method: 'GET',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    // Loại bỏ password từ response và flatten department object
    return data.map((group: any) => ({
      department: group.department,
      users: group.users.map((emp: any) => {
        const { password, ...employeeWithoutPassword } = emp;
        return {
          ...employeeWithoutPassword,
          department:
            emp.department && typeof emp.department === 'object'
              ? emp.department.name
              : (emp.department ?? null),
          departmentCode:
            emp.department && typeof emp.department === 'object'
              ? emp.department.code
              : null,
          role:
            emp.role && typeof emp.role === 'object'
              ? emp.role.name
              : (emp.role ?? null),
        };
      }),
    }));
  },

  /**
   * Lấy danh sách tất cả employees
   * API endpoint: GET /users (không có /api prefix)
   */
  async getAllEmployees(): Promise<Employee[]> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users`, {
      method: 'GET',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    // Loại bỏ password từ response để bảo mật
    return data.map((emp: any) => {
      const { password, ...employeeWithoutPassword } = emp;
      return employeeWithoutPassword;
    });
  },

  /**
   * Lấy thông tin chi tiết một employee
   * @param employeeId ID của employee
   * API endpoint: GET /users/detail/{employeeId} (theo curl command user cung cấp)
   */
  async getEmployeeById(employeeId: string): Promise<Employee> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const response = await fetch(`${baseUrl}/users/detail/${employeeId}`, {
      method: 'GET',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}: Cannot GET /users/detail/${employeeId}`);
    }

    const data = await response.json();
    // Loại bỏ password và flatten department/role objects
    const { password, ...employeeWithoutPassword } = data;
    return {
      ...employeeWithoutPassword,
      department:
        data.department && typeof data.department === 'object'
          ? data.department.name
          : (data.department ?? null),
      departmentCode:
        data.department && typeof data.department === 'object'
          ? data.department.code
          : null,
      role:
        data.role && typeof data.role === 'object'
          ? data.role.name
          : (data.role ?? null),
    };
  },

  /**
   * Tạo employee mới
   * @param data Dữ liệu employee
   */
  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  /**
   * Cập nhật employee
   * @param employeeId ID của employee
   * @param data Dữ liệu cập nhật
   */
  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<Employee> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users/${employeeId}`, {
      method: 'PUT',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  /**
   * Xóa employee
   * @param employeeId ID của employee
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }
  },
};
