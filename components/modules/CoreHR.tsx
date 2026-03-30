"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  Users, Building2, User, Laptop, Lock, Eye, EyeOff,
  Plus, Pencil, Trash2, Search, ChevronRight, CheckCircle2,
  Mail, Fingerprint, Loader2
} from 'lucide-react';
import type { User as UserType } from '@/lib/auth-types';
import { employeeService, type Employee } from '@/services/employee.service';
import { departmentService, type Department } from '@/services/department.service';
import { assetService, type AllocatedAsset } from '@/services/asset.service';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/use-permissions';
import { Button } from '@/components/ui/button';

interface CoreHRProps {
  user: UserType;
  defaultTab?: CoreHRTab;
}

type CoreHRTab = 'orgchart' | 'profile' | 'assets';

interface EmployeeFormData {
  id: string;
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  citizen_Id: string;
  department: string;
  position: string;
  address: string;
  taxCode: string;
  status: string;
  role: string;
  salaryPerDay: string;
}

const defaultEmployeeForm: EmployeeFormData = {
  id: '',
  fullName: '',
  email: '',
  password: '',
  isActive: true,
  phoneNumber: '',
  gender: 'male',
  dateOfBirth: '',
  citizen_Id: '',
  department: 'IT',
  position: 'Employee',
  address: '',
  taxCode: '',
  status: 'active',
  role: 'Employee',
  salaryPerDay: '',
};


export function CoreHR({ user, defaultTab }: CoreHRProps) {
  const [activeTab, setActiveTab] = useState<CoreHRTab>(defaultTab || 'profile');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(defaultEmployeeForm);
  const [initialEmployeeForm, setInitialEmployeeForm] = useState<EmployeeFormData | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [departmentsData, setDepartmentsData] = useState<Array<{
    department: string;
    users: Employee[];
  }>>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployeeDetail, setIsLoadingEmployeeDetail] = useState(false);
  const [allocatedAssets, setAllocatedAssets] = useState<AllocatedAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '' });
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptForm, setEditDeptForm] = useState({ code: '', name: '', description: '' });
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const { hasPermission, isAdmin } = usePermissions();

  // State to manage opening/closing the employee list in a department
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

  // Kiểm tra quyền xem tổ chức (admin hoặc có USER_VIEW)
  const canViewOrg = isAdmin || hasPermission('USER_VIEW');

  // Kiểm tra quyền xem vai trò (admin hoặc có ROLE_VIEW)
  const canViewRole = isAdmin || hasPermission('ROLE_VIEW');

  // If user has permission and no defaultTab is specified, default to orgchart tab
  useEffect(() => {
    if (canViewOrg && !defaultTab) {
      setActiveTab('orgchart');
    }
  }, [canViewOrg]);

  // Fetch employees theo department từ API — chỉ khi có quyền
  useEffect(() => {
    if (canViewOrg) {
      fetchEmployeesByDepartment();
    }
  }, [canViewOrg]);

  /**
   * Combine full department list (GET /departments) with employees grouped by department,
   * so that empty departments still show on the org chart.
   */
  const mergeDepartmentsWithEmployees = async (
    grouped: Array<{ department: string; users: Employee[] }>
  ): Promise<Array<{ department: string; users: Employee[] }>> => {
    try {
      const allDepts = await departmentService.getDepartments();
      setAllDepartments(allDepts);
      if (!allDepts.length) return grouped;

      const byName = new Map<string, Employee[]>();
      grouped.forEach((g) => {
        byName.set(g.department, g.users);
      });

      const masterNames = new Set(allDepts.map((d) => d.name));
      const merged: Array<{ department: string; users: Employee[] }> = [];

      for (const d of allDepts) {
        merged.push({
          department: d.name,
          users: byName.get(d.name) ?? [],
        });
      }

      for (const g of grouped) {
        if (!masterNames.has(g.department)) {
          merged.push(g);
        }
      }

      return merged;
    } catch (e) {
      console.warn('Could not merge with full department list:', e);
      return grouped;
    }
  };

  /**
   * Load org data.
   * Prefer group-by-department endpoint; if backend error (500), fallback to getAllEmployees and group by department on FE.
   */
  const fetchEmployeesByDepartment = async () => {
    setIsLoadingEmployees(true);
    try {
      try {
        // Try calling group-by-department endpoint (if backend is OK, use this data)
        const data = await employeeService.getEmployeesByDepartment();
        setDepartmentsData(await mergeDepartmentsWithEmployees(data));
        return;
      } catch (err) {
        console.warn('group-by-department API failed, falling back to getAllEmployees():', err);
      }

      // Fallback: use getAllEmployees and group by department on FE
      const allEmployees = await employeeService.getAllEmployees();

      const deptMap = new Map<string, Employee[]>();

      allEmployees.forEach((emp: any) => {
        const deptName =
          emp.department && typeof emp.department === 'object'
            ? emp.department.name
            : (emp.department || 'Other');

        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, []);
        }
        deptMap.get(deptName)!.push(emp);
      });

      const grouped = Array.from(deptMap.entries()).map(([department, users]) => ({
        department,
        users,
      }));

      setDepartmentsData(await mergeDepartmentsWithEmployees(grouped));
    } catch (error: any) {
      console.error('Error building org chart data:', error);
      toast.error('Cannot load organization chart', {
        description: error.message || 'Please try again later',
      });
      setDepartmentsData([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleViewEmployee = async (employeeId: string) => {
    setIsLoadingEmployeeDetail(true);
    try {
      // Try to find employee from existing data first
      let employee: Employee | undefined = undefined;

      // Find in departmentsData (org chart)
      for (const group of departmentsData) {
        employee = group.users.find(u => u.id === employeeId);
        if (employee) break;
      }

      // If not found, search in allEmployees (profile tab)
      if (!employee) {
        employee = allEmployees.find(u => u.id === employeeId);
      }

      // If still not found, try calling API
      if (!employee) {
        try {
          employee = await employeeService.getEmployeeById(employeeId);
        } catch (apiError: any) {
          // If API fails, still try to find in existing data
          console.warn('API call failed, using cached data:', apiError);
        }
      }

      if (employee) {
        setSelectedEmployee(employee);
        // Switch to Profile tab when viewing detail
        setActiveTab('profile');
        // Fetch assets for this employee immediately (without await to not block UI)
        fetchEmployeeAssets(employeeId).catch(err => {
          console.warn('Failed to fetch assets:', err);
        });
      } else {
        throw new Error('Cannot find employee information');
      }
    } catch (error: any) {
      console.error('Error fetching employee detail:', error);
      toast.error('Cannot load employee information', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setIsLoadingEmployeeDetail(false);
    }
  };

  const fetchEmployeeAssets = async (employeeId: string) => {
    if (!employeeId) {
      console.warn('No employeeId provided for fetching assets');
      return;
    }

    setIsLoadingAssets(true);
    try {
      console.log('Fetching assets for employee:', employeeId);
      const assets = await assetService.getAllocatedAssetsByEmployee(employeeId);
      console.log('Fetched assets:', assets);
      console.log('Assets count:', assets?.length || 0);
      setAllocatedAssets(assets || []);

      // Log for debugging
      if (assets && assets.length > 0) {
        console.log('Assets data:', JSON.stringify(assets, null, 2));
      } else {
        console.warn('No assets returned from API');
      }
    } catch (error: any) {
      console.error('❌ Error fetching allocated assets:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // If permissions error, still set empty array but log warning
      if (error.message?.includes('quyền') || error.message?.includes('permission') || error.message?.includes('403')) {
        console.warn('⚠️ No permission to view assets, showing empty state');
        setAllocatedAssets([]);
      } else {
        // Other errors still set empty array
        console.warn('⚠️ Error occurred, showing empty state');
        setAllocatedAssets([]);
      }
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Fetch assets khi chuyển sang tab assets
  // If there is a selectedEmployee, fetch their assets
  // If selectedEmployee is empty, fetch assets for logged-in user
  useEffect(() => {
    if (activeTab === 'assets') {
      if (selectedEmployee?.id) {
        // Employee is selected, fetch their assets
        fetchEmployeeAssets(selectedEmployee.id);
      } else if (user?.id) {
        // Employee not selected, fetch assets for logged-in user
        console.log('No employee selected, fetching assets for logged-in user:', user.id);
        fetchEmployeeAssets(user.id);
      }
    }
  }, [activeTab, selectedEmployee?.id, user?.id]);

  // Build org chart from API response
  const orgChart = useMemo(() => {
    const departments: Array<{
      id: string;
      name: string;
      manager: string;
      employees: number;
      level: number;
      deptKey: string;
      parent?: string;
    }> = [];

    // Find Board of Directors (employees with position = CEO or no department)
    let ceoEmployees: Employee[] = [];
    let ceoManager = 'CEO';

    departmentsData.forEach(group => {
      const ceos = group.users.filter(u => u.position === 'CEO');
      if (ceos.length > 0) {
        ceoEmployees = ceoEmployees.concat(ceos);
        ceoManager = ceos[0].fullName || 'CEO';
      }
    });

    // If no CEO, find first Manager
    if (ceoEmployees.length === 0) {
      departmentsData.forEach(group => {
        const managers = group.users.filter(u => u.position === 'Manager');
        if (managers.length > 0 && ceoManager === 'CEO') {
          ceoManager = managers[0].fullName || 'CEO';
        }
      });
    }

    // Create Board of Directors
    if (ceoEmployees.length > 0 || departmentsData.length > 0) {
      departments.push({
        id: '1',
        name: 'Board of Directors',
        manager: ceoManager,
        employees: ceoEmployees.length,
        level: 0,
        deptKey: 'CEO',
      });
    }

    // Create departments from API response
    departmentsData.forEach((group, index) => {
      const deptName = group.department;
      const deptUsers = group.users;

      // Find manager (prefer Manager, then CEO)
      const manager = deptUsers.find(u => u.position === 'Manager')?.fullName ||
        deptUsers.find(u => u.position === 'CEO')?.fullName ||
        'None';

      departments.push({
        id: String(index + 2),
        name: `${deptName} Department`,
        parent: '1',
        manager: manager,
        employees: deptUsers.length,
        level: 1,
        deptKey: deptName,
      });
    });

    return departments;
  }, [departmentsData]);

  // Flatten all employees for use in profile tab
  const employees = useMemo(() => {
    return departmentsData.flatMap(group => group.users);
  }, [departmentsData]);

  const tabs: { id: CoreHRTab; label: string; icon: typeof Building2 }[] = [
    ...(canViewOrg ? [{ id: 'orgchart' as CoreHRTab, label: 'Organization', icon: Building2 }] : []),
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'assets', label: 'Assets', icon: Laptop },
  ];

  const isSystemAdmin = user.role === 'System Admin';

  // Fetch all employees for profile tab (if needed)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const fetchAllEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      // Flatten department and role objects
      const flattened = data.map((emp: any) => ({
        ...emp,
        department:
          emp.department && typeof emp.department === 'object'
            ? emp.department.name
            : (emp.department ?? null),
        role:
          emp.role && typeof emp.role === 'object'
            ? emp.role.name
            : (emp.role ?? null),
      }));
      setAllEmployees(flattened);
    } catch (error: any) {
      console.error('Error fetching all employees:', error);
      toast.error('Cannot load employee list', {
        description: error.message || 'Please try again later',
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && isSystemAdmin) {
      fetchAllEmployees();
    }
  }, [activeTab, isSystemAdmin]);

  // Autoload profile of logged-in user when no employee is selected and on profile tab
  useEffect(() => {
    if (activeTab === 'profile' && !selectedEmployee && user?.id) {
      console.log('No employee selected, loading profile for logged-in user:', user.id);
      // Call API directly to load profile, don't use handleViewEmployee to avoid setActiveTab
      const loadUserProfile = async () => {
        setIsLoadingEmployeeDetail(true);
        try {
          let employee: Employee | undefined = undefined;

          // Tìm trong departmentsData (org chart)
          for (const group of departmentsData) {
            employee = group.users.find(u => u.id === user.id);
            if (employee) break;
          }

          // If not found, search in allEmployees (profile tab)
          if (!employee) {
            employee = allEmployees.find(u => u.id === user.id);
          }

          // If still not found, try calling API
          if (!employee) {
            try {
              employee = await employeeService.getEmployeeById(user.id);
            } catch (apiError: any) {
              console.warn('API call failed, using cached data:', apiError);
            }
          }

          if (employee) {
            setSelectedEmployee(employee);
            // Fetch assets cho user này
            fetchEmployeeAssets(user.id).catch(err => {
              console.warn('Failed to fetch assets:', err);
            });
          }
        } catch (error: any) {
          console.error('Error loading user profile:', error);
        } finally {
          setIsLoadingEmployeeDetail(false);
        }
      };

      loadUserProfile();
    }
  }, [activeTab, user?.id, departmentsData, allEmployees]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const employeeList = activeTab === 'profile' && isSystemAdmin ? allEmployees : employees;
    if (!keyword) return employeeList;
    return employeeList.filter((emp) => {
      // Flatten department and role into string for search
      const deptStr = typeof emp.department === 'object' && emp.department !== null
        ? emp.department.name
        : emp.department || '';
      const roleStr = typeof emp.role === 'object' && emp.role !== null
        ? emp.role.name
        : emp.role || '';

      const searchValues = [
        emp.id,
        emp.fullName,
        deptStr,
        roleStr
      ].filter(Boolean); // Remove null/undefined

      return searchValues.some((value) =>
        typeof value === 'string' && value.toLowerCase().includes(keyword)
      );
    });
  }, [employees, allEmployees, searchTerm, activeTab, isSystemAdmin]);

  const openAddModal = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(defaultEmployeeForm);
    setInitialEmployeeForm(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    // Flatten department and role into string
    const deptStr = typeof emp.department === 'object' && emp.department !== null
      ? emp.department.name
      : emp.department || '';
    const roleStr = typeof emp.role === 'string'
      ? emp.role
      : (emp.role && typeof emp.role === 'object' ? emp.role.name : '') || '';

    const newForm = {
      ...defaultEmployeeForm,
      id: emp.id,
      fullName: emp.fullName || '',
      email: emp.email || '',
      department: deptStr,
      position: emp.position || '',
      role: roleStr,
      phoneNumber: emp.phoneNumber || '',
      gender: emp.gender || 'male',
      dateOfBirth: emp.dateOfBirth || '',
      citizen_Id: emp.citizen_Id || '',
      address: emp.address || '',
      taxCode: emp.taxCode || '',
      status: emp.status || 'active',
      isActive: emp.isActive ?? true,
      salaryPerDay: emp.salaryPerDay ? String(emp.salaryPerDay) : '',
    };
    setEmployeeForm(newForm);
    setInitialEmployeeForm(newForm);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!hasPermission('USER_DELETE')) {
      toast.error('You do not have permission to delete employees');
      return;
    }
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await employeeService.deleteEmployee(employeeId);
      toast.success('Employee deleted successfully');
      // Refresh data
      await fetchEmployeesByDepartment();
      if (activeTab === 'profile' && isSystemAdmin) {
        await fetchAllEmployees();
      }
      // Clear selected employee if deleted
      if (selectedEmployee?.id === employeeId) {
        setSelectedEmployee(null);
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error('Cannot delete employee', {
        description: error.message || 'Please try again later',
      });
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!hasPermission('DEPARTMENT_UPDATE')) {
      toast.error('You do not have permission to update departments');
      return;
    }
    setIsUpdatingDept(true);
    try {
      await departmentService.updateDepartment(editingDept.id, editDeptForm);
      toast.success('Department updated successfully');
      setEditingDept(null);
      await fetchEmployeesByDepartment();
    } catch (error: any) {
      toast.error(error.message || 'Error updating department');
    } finally {
      setIsUpdatingDept(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('DEPARTMENT_CREATE')) {
      toast.error('You do not have permission to create departments');
      return;
    }

    try {
      await departmentService.createDepartment(deptForm);
      toast.success('Department created successfully');
      setIsDeptModalOpen(false);
      setDeptForm({ code: '', name: '', description: '' });
      // Refresh data
      await fetchAllEmployees();
      await fetchEmployeesByDepartment();
    } catch (error: any) {
      toast.error(error.message || 'Error creating department');
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let payload: Partial<Employee> = {};

    if (editingEmployeeId && initialEmployeeForm) {
      payload.id = editingEmployeeId;
      if (employeeForm.fullName !== initialEmployeeForm.fullName) payload.fullName = employeeForm.fullName;
      if (employeeForm.email !== initialEmployeeForm.email) payload.email = employeeForm.email;
      if (employeeForm.phoneNumber !== initialEmployeeForm.phoneNumber) payload.phoneNumber = employeeForm.phoneNumber;
      if (employeeForm.gender !== initialEmployeeForm.gender) payload.gender = employeeForm.gender;
      if (employeeForm.dateOfBirth !== initialEmployeeForm.dateOfBirth) payload.dateOfBirth = employeeForm.dateOfBirth;
      if (employeeForm.citizen_Id !== initialEmployeeForm.citizen_Id) payload.citizen_Id = employeeForm.citizen_Id;
      if (employeeForm.department !== initialEmployeeForm.department) payload.department = employeeForm.department;
      if (employeeForm.position !== initialEmployeeForm.position) payload.position = employeeForm.position;
      if (employeeForm.address !== initialEmployeeForm.address) payload.address = employeeForm.address;
      if (employeeForm.taxCode !== initialEmployeeForm.taxCode) payload.taxCode = employeeForm.taxCode;
      if (employeeForm.status !== initialEmployeeForm.status) payload.status = employeeForm.status;
      if (employeeForm.isActive !== initialEmployeeForm.isActive) payload.isActive = employeeForm.isActive;
      if (employeeForm.salaryPerDay !== initialEmployeeForm.salaryPerDay) {
        payload.salaryPerDay = employeeForm.salaryPerDay ? Number(employeeForm.salaryPerDay) : null;
      }
      if (employeeForm.password) payload.password = employeeForm.password;

      if (Object.keys(payload).length <= 1) {
        toast.info('No changes made');
        setIsModalOpen(false);
        return;
      }
    } else {
      payload = {
        fullName: employeeForm.fullName,
        email: employeeForm.email,
        phoneNumber: employeeForm.phoneNumber,
        gender: employeeForm.gender,
        dateOfBirth: employeeForm.dateOfBirth,
        citizen_Id: employeeForm.citizen_Id,
        department: employeeForm.department,
        position: employeeForm.position,
        address: employeeForm.address,
        taxCode: employeeForm.taxCode,
        status: employeeForm.status,
        isActive: employeeForm.isActive,
        ...(employeeForm.salaryPerDay && { salaryPerDay: Number(employeeForm.salaryPerDay) }),
        ...(employeeForm.password && { password: employeeForm.password }),
      };
    }

    try {
      if (editingEmployeeId) {
        await employeeService.updateEmployee(editingEmployeeId, payload);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.createEmployee(payload);
        toast.success('Employee created successfully');
      }
      setIsModalOpen(false);
      // Refresh data
      await fetchEmployeesByDepartment();
      if (activeTab === 'profile' && isSystemAdmin) {
        await fetchAllEmployees();
      }
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(editingEmployeeId ? 'Cannot update employee' : 'Cannot create employee', {
        description: error.message || 'Please try again later',
      });
    }
  };


  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const maskData = (data: string) => {
    if (showSensitiveData) return data;
    return "••••••••" + data.slice(-4);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      {/* Improved Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-200">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Core HR</h2>
            <p className="text-slate-500 font-medium flex items-center gap-1.5 text-sm">
              <Fingerprint className="w-4 h-4 text-purple-500" />
              Centralized identity & profile management
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 w-fit shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-md border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[500px]">
        {/* --- ORG CHART TAB --- */}
        {activeTab === 'orgchart' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-900">Online Organization Chart</h3>
              <div className="flex items-center gap-3">
                {hasPermission('DEPARTMENT_CREATE') && (
                  <Button
                    onClick={() => setIsDeptModalOpen(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Department
                  </Button>
                )}
                <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-black uppercase">Live Update</span>
              </div>
            </div>

            {isLoadingEmployees ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-slate-500">Loading organization chart...</span>
              </div>
            ) : orgChart.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[20px] p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">No organization data</h4>
                <p className="text-slate-500 text-sm">Organization chart will be displayed when employee data is available.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orgChart.map((dept) => {
                  const isExpanded = expandedDepts.includes(dept.id);
                  // Get employees from departmentsData
                  let deptEmps: Employee[] = [];
                  if (dept.deptKey === 'CEO') {
                    // Board of Directors: get all employees with position = CEO
                    departmentsData.forEach(group => {
                      const ceos = group.users.filter(u => u.position === 'CEO');
                      deptEmps = deptEmps.concat(ceos);
                    });
                  } else {
                    // Other departments: get from departmentsData
                    const group = departmentsData.find(g => g.department === dept.deptKey);
                    deptEmps = group ? group.users : [];
                  }

                  return (
                    <div key={dept.id} style={{ marginLeft: `${dept.level * 2}rem` }} className="space-y-3">
                      <div
                        onClick={() => toggleDept(dept.id)}
                        className={`group flex items-center justify-between p-5 bg-white border rounded-[20px] transition-all cursor-pointer ${isExpanded ? 'border-purple-400 shadow-lg shadow-purple-50 ring-1 ring-purple-100' : 'border-slate-100 hover:border-purple-200 hover:shadow-md'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dept.level === 0 || isExpanded ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600'
                            }`}>
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{dept.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              Manager: <span className="text-slate-900">{dept.manager}</span> • {dept.employees} employees
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasPermission('DEPARTMENT_UPDATE') && (() => {
                            const fullDept = allDepartments.find(d => d.name === dept.deptKey);
                            return fullDept ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDept(fullDept);
                                  setEditDeptForm({ code: fullDept.code, name: fullDept.name, description: fullDept.description || '' });
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit department"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            ) : null;
                          })()}
                          <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-purple-50 text-purple-600 rotate-90' : 'text-slate-300'}`}>
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Detailed employee list when expanded */}
                      {isExpanded && (
                        <div className="ml-6 border-l-2 border-purple-100 pl-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
                          {isLoadingEmployees ? (
                            <div className="p-4 flex items-center gap-2 text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs">Loading...</span>
                            </div>
                          ) : deptEmps.length > 0 ? deptEmps.map(emp => (
                            <div
                              key={emp.id}
                              onClick={() => handleViewEmployee(emp.id)}
                              className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-purple-200 hover:bg-white transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                  {(() => {
                                    const name = emp.fullName || emp.email || '';
                                    const parts = name.split(' ').filter(Boolean);
                                    const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
                                    return lastPart && lastPart.length > 0 ? lastPart.charAt(0).toUpperCase() : 'U';
                                  })()}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">{emp.fullName || 'N/A'}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {emp.position === 'Manager' ? 'MANAGER' : emp.position === 'CEO' ? 'CEO' : (emp.position || 'EMPLOYEE')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="hidden md:flex flex-col items-end">
                                  <span className="text-[10px] font-mono text-slate-400">{emp.email || 'N/A'}</span>
                                  <span className="text-[10px] font-bold text-slate-500">{emp.id}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {hasPermission('USER_UPDATE') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(emp);
                                      }}
                                      className="p-2 hover:bg-purple-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                      title="Edit employee"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  {hasPermission('USER_DELETE') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEmployee(emp.id);
                                      }}
                                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                      title="Delete employee"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewEmployee(emp.id);
                                    }}
                                    className="p-2 hover:bg-purple-50 text-slate-300 hover:text-purple-600 rounded-lg transition-colors"
                                    title="View details"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="p-4 text-xs text-slate-400 italic bg-slate-50/50 rounded-xl">No employees in this department</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {selectedEmployee ? (
              /* Display selected employee details */
              <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                {isLoadingEmployeeDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-slate-500">Loading employee information...</span>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowSensitiveData(!showSensitiveData);
                        }}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-purple-600 transition-all uppercase tracking-widest"
                      >
                        {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showSensitiveData ? 'Hide info' : 'View PII info'}
                      </button>
                    </div>

                    <div className="flex items-start gap-6 mb-8">
                      <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                        {(() => {
                          const name = selectedEmployee.fullName || selectedEmployee.email || '';
                          const parts = name.split(' ').filter(Boolean);
                          const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
                          return lastPart && lastPart.length > 0 ? lastPart.charAt(0).toUpperCase() : 'U';
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                          {selectedEmployee.position === 'Manager' ? 'Manager' :
                            selectedEmployee.position === 'CEO' ? 'CEO' :
                              selectedEmployee.position ||
                              (typeof selectedEmployee.role === 'string' ? selectedEmployee.role : selectedEmployee.role?.name) ||
                              'Employee'}
                        </h3>
                        <p className="text-slate-500 text-sm">{selectedEmployee.fullName}</p>
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Back
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Column 1: Basic Information */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Employee ID</div>
                          <p className="text-base font-bold text-slate-900">{selectedEmployee.id}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            CCCD/ID Number
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            {showSensitiveData ? (selectedEmployee.citizen_Id || 'N/A') : maskData(selectedEmployee.citizen_Id || '')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Gender</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.gender === 'male' ? 'Male' : selectedEmployee.gender === 'female' ? 'Female' : selectedEmployee.gender || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Date of Birth</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString('en-US') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Contact Information */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Work Email</div>
                          <p className="text-base font-bold text-slate-900">{selectedEmployee.email || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Phone Number
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            {showSensitiveData ? (selectedEmployee.phoneNumber || 'N/A') : maskData(selectedEmployee.phoneNumber || '')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Tax Code
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            {showSensitiveData ? (selectedEmployee.taxCode || 'N/A') : maskData(selectedEmployee.taxCode || '')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Address</div>
                          <p className="text-base font-bold text-slate-900">{selectedEmployee.address || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Column 3: Work Information */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Department</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.department && typeof selectedEmployee.department === 'object'
                              ? selectedEmployee.department.name
                              : (selectedEmployee.department || 'N/A')}
                          </p>
                          {selectedEmployee.department && typeof selectedEmployee.department === 'object' && selectedEmployee.department.description && (
                            <p className="text-xs text-slate-500 mt-1">{selectedEmployee.department.description}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Position</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.position === 'Manager' ? 'Manager' :
                              selectedEmployee.position === 'CEO' ? 'CEO' :
                                selectedEmployee.position === 'Employee' ? 'Employee' :
                                  selectedEmployee.position || 'N/A'}
                          </p>
                        </div>
                        {canViewRole && (
                          <div className="space-y-2">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Role</div>
                            <p className="text-base font-bold text-slate-900">
                              {selectedEmployee.role && typeof selectedEmployee.role === 'object'
                                ? selectedEmployee.role.name
                                : (selectedEmployee.role || 'N/A')}
                            </p>
                            {selectedEmployee.role && typeof selectedEmployee.role === 'object' && selectedEmployee.role.description && (
                              <p className="text-xs text-slate-500 mt-1">{selectedEmployee.role.description}</p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Status</div>
                          <p className="text-base font-bold text-slate-900">
                            <span className={`px-3 py-1 rounded-lg text-xs font-black ${selectedEmployee.status === 'Active' || selectedEmployee.isActive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-600'
                              }`}>
                              {selectedEmployee.status || (selectedEmployee.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : hasPermission('USER_VIEW') ? (
              <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                      placeholder="Search employee ID, name, department..."
                    />
                  </div>
                  {hasPermission('USER_CREATE') && (
                    <button
                      onClick={openAddModal}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-slate-200 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add New Employee
                    </button>
                  )}
                </div>
                {/* Employee table with old logic but improved CSS */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">Employee</th>
                        <th className="px-8 py-4">Department</th>
                        <th className="px-8 py-4">Position</th>
                        {canViewRole && <th className="px-8 py-4">Role</th>}
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          onClick={() => handleViewEmployee(emp.id)}
                          className="hover:bg-slate-50/30 transition-colors group cursor-pointer"
                        >
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-xs font-mono text-slate-400">{emp.id}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">
                              {typeof emp.department === 'object' && emp.department !== null
                                ? emp.department.name
                                : emp.department || 'N/A'}
                            </span>
                          </td>
                          {canViewRole && (
                            <td className="px-8 py-5 text-sm font-medium text-slate-600">
                              {typeof emp.role === 'object' && emp.role !== null
                                ? emp.role.name
                                : emp.role || 'N/A'}
                            </td>
                          )}
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-1">
                              {hasPermission('USER_UPDATE') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(emp);
                                  }}
                                  className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-blue-600"
                                  title="Edit employee"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEmployee(emp.id);
                                }}
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-purple-600"
                                title="View details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              {hasPermission('USER_DELETE') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmployee(emp.id);
                                  }}
                                  className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Profile view UI for Employee */
              <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
                  <button onClick={() => setShowSensitiveData(!showSensitiveData)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-purple-600 transition-all uppercase tracking-widest">
                    {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSensitiveData ? 'Hide info' : 'View PII info'}
                  </button>
                </div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-600">
                    {(user.fullName && user.fullName.length > 0) ? user.fullName.charAt(0) : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{user.fullName || user.email || 'N/A'}</h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      {typeof user.role === 'object' ? user.role.name : (user.role || 'N/A')} • {typeof user.department === 'object' ? user.department.name : (user.department || 'N/A')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {[
                    { label: 'Employee ID', value: 'EMP-2024-001', icon: Fingerprint },
                    { label: 'Work Email', value: user.email, icon: Mail },
                    { label: 'Phone Number', value: '0912345678', sensitive: true },
                    { label: 'ID Number', value: '001234567890', sensitive: true },
                    { label: 'Tax Code', value: '8765432109', sensitive: true },
                    { label: 'Join Date', value: '15/01/2020', icon: CheckCircle2 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5 group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {item.sensitive && <Lock className="w-3 h-3 text-amber-500" />}
                        {item.label}
                      </label>
                      <p className="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                        {item.sensitive ? maskData(item.value) : item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ASSETS TAB --- */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-900">
                {selectedEmployee
                  ? `Allocated Assets - ${selectedEmployee.fullName}`
                  : `Allocated Assets - ${user.fullName || user.email}`}
              </h3>
              {!selectedEmployee && (
                <p className="text-sm text-slate-500">Showing your assets</p>
              )}
            </div>

            {selectedEmployee || user?.id ? (
              <>
                {isLoadingAssets ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-slate-500">Loading assets...</span>
                  </div>
                ) : allocatedAssets.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[24px] p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Laptop className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">No assets allocated</h4>
                    <p className="text-slate-500 text-sm">
                      {selectedEmployee
                        ? 'This employee has not been allocated any assets.'
                        : 'You have not been allocated any assets.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Debug: Employee ID = {selectedEmployee?.id || user?.id}, Assets count = {allocatedAssets.length}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allocatedAssets.map((allocatedAsset) => {
                      const asset = allocatedAsset.asset;
                      const statusColor = allocatedAsset.status === 'allocated'
                        ? 'bg-emerald-50 text-emerald-600'
                        : allocatedAsset.status === 'returned'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-600';

                      const statusText = allocatedAsset.status === 'allocated'
                        ? 'In use'
                        : allocatedAsset.status === 'returned'
                          ? 'Returned'
                          : allocatedAsset.status;

                      return (
                        <div key={allocatedAsset.id} className="bg-white border border-slate-200 rounded-[24px] p-6 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                              <Laptop className="w-6 h-6" />
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-900 text-lg mb-1">{asset.name}</h4>
                          <p className="text-xs font-mono text-slate-400 mb-2">SN: {asset.serialNumber}</p>
                          <p className="text-xs text-slate-500 mb-1">
                            <span className="font-bold">Asset Code:</span> {asset.assetCode}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">
                            <span className="font-bold">Brand:</span> {asset.brand} - {asset.model}
                          </p>
                          <p className="text-xs text-slate-500 mb-6">
                            <span className="font-bold">Category:</span> {asset.category}
                          </p>
                          <div className="space-y-2 border-t border-slate-50 pt-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                              <span>Allocated</span>
                              <span className="text-slate-900">
                                {allocatedAsset.allocatedDate ? new Date(allocatedAsset.allocatedDate).toLocaleDateString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                            {allocatedAsset.returnedDate && (
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>Returned</span>
                                <span className="text-slate-900">
                                  {new Date(allocatedAsset.returnedDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            )}
                          </div>
                          {allocatedAsset.note && (
                            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-50 italic">
                              {allocatedAsset.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-[24px] p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Laptop className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Cannot load assets</h4>
                <p className="text-slate-500 text-sm">Please login again or contact administrator.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">{editingEmployeeId ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Employee ID" value={employeeForm.id} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, id: value }))} placeholder="EMP-2024-001" disabled={!!editingEmployeeId} />
              <FormField label="Full Name" value={employeeForm.fullName} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, fullName: value }))} required />
              <FormField label="Email" type="email" value={employeeForm.email} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, email: value }))} required />
              <FormField label="Password" type="password" value={employeeForm.password} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, password: value }))} />
              <FormField label="Phone Number" value={employeeForm.phoneNumber} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, phoneNumber: value }))} required />
              <FormField label="Gender" value={employeeForm.gender} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, gender: value }))} placeholder="male/female/other" required />
              <FormField label="Date of Birth" type="date" value={employeeForm.dateOfBirth} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, dateOfBirth: value }))} required />
              <FormField label="ID Number" value={employeeForm.citizen_Id} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, citizen_Id: value }))} required />
              <FormField label="Department" value={employeeForm.department} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, department: value }))} required />
              <FormField label="Position" value={employeeForm.position} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, position: value }))} required />
              {canViewRole && (
                <FormField label="Role" value={employeeForm.role} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, role: value }))} required />
              )}
              <FormField label="Address" value={employeeForm.address} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, address: value }))} required />
              <FormField label="Tax Code" value={employeeForm.taxCode} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, taxCode: value }))} required />
              <FormField label="Status" value={employeeForm.status} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, status: value }))} required />
              <FormField label="Salary per Day" type="number" value={employeeForm.salaryPerDay} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, salaryPerDay: value }))} />
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={employeeForm.isActive}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Active</label>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">{editingEmployeeId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeptModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        form={deptForm}
        setForm={setDeptForm}
        onSubmit={handleCreateDepartment}
      />

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Update Department</h3>
              <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
              <FormField
                label="Department Code"
                value={editDeptForm.code}
                onChange={(val) => setEditDeptForm(prev => ({ ...prev, code: val }))}
                placeholder="e.g.: DEP001"
                required
              />
              <FormField
                label="Department Name"
                value={editDeptForm.name}
                onChange={(val) => setEditDeptForm(prev => ({ ...prev, name: val }))}
                placeholder="e.g.: Engineering"
                required
              />
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Description</span>
                <textarea
                  value={editDeptForm.description}
                  onChange={(e) => setEditDeptForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the department..."
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] text-sm"
                />
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDept}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdatingDept && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />
    </label>
  );
}

function DeptModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  form: { code: string; name: string; description: string };
  setForm: React.Dispatch<React.SetStateAction<{ code: string; name: string; description: string }>>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900">Add New Department</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <FormField
            label="Department Code"
            value={form.code}
            onChange={(val) => setForm(prev => ({ ...prev, code: val }))}
            placeholder="e.g.: IT, HR, MKT..."
            required
          />
          <FormField
            label="Department Name"
            value={form.name}
            onChange={(val) => setForm(prev => ({ ...prev, name: val }))}
            placeholder="e.g.: Information Technology..."
            required
          />
          <label className="flex flex-col gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the department..."
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] text-sm"
            />
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
