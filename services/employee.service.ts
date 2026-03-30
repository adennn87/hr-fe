import { API_URL } from '@/lib/api';

// Define types for Employee - match with API response
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  password?: string; // Only in response, not used for display
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
  departmentCode?: string | null; // Flatten from department object
  position?: string | null;
  address?: string | null;
  taxCode?: string | null;
  status?: string | null;
  salaryPerDay?: string | number | null;
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
   * Get list of employees by department
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

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      let errorData: any = null;

      try {
        if (responseText) {
          errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        // responseText is not JSON, keep errorMessage intact
      }

      console.error('❌ Error fetching employees by department:', {
        status: response.status,
        errorMessage,
        rawResponse: responseText?.slice(0, 500), // limit log
      });

      throw new Error(errorMessage);
    }

    const data = responseText ? JSON.parse(responseText) : [];
    // Remove password from response and flatten department object
    return data.map((group: any) => ({
      department: group.department,
      users: group.users.map((emp: any) => {
        const { password, full_name, ...employeeWithoutPassword } = emp;
        // Map full_name (snake_case) -> fullName (camelCase) if backend returns snake_case
        return {
          ...employeeWithoutPassword,
          fullName: emp.fullName || emp.full_name || '',
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
   * Get list of all employees
   * API endpoint: GET /users (without /api prefix)
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
    // Remove password from response and map full_name -> fullName
    return data.map((emp: any) => {
      const { password, full_name, ...employeeWithoutPassword } = emp;
      return {
        ...employeeWithoutPassword,
        fullName: emp.fullName || emp.full_name || '',
      };
    });
  },

  /**
   * Get detailed information of an employee
   * @param employeeId ID of employee
   * API endpoint: GET /users/detail/{employeeId} (from curl command provided by user)
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
    // Remove password and flatten department/role objects, map full_name -> fullName
    const { password, full_name, ...employeeWithoutPassword } = data;
    return {
      ...employeeWithoutPassword,
      fullName: data.fullName || data.full_name || '',
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
   * Create new employee
   * @param data Employee data
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
   * Update employee
   * @param employeeId ID of employee
   * @param data Data to update
   */
  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<Employee> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users/userAdmin?id=${employeeId}`, {
      method: 'PATCH',
      headers: {
        'accept': '*/*',
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
   * Delete employee
   * @param employeeId ID of employee
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/users/DeleteUser?id=${employeeId}`, {
      method: 'DELETE',
      headers: {
        'accept': '*/*',
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
