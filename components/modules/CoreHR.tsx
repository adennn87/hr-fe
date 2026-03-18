"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  Users, Building2, User, Laptop, Lock, Eye, EyeOff,
  Plus, Pencil, Trash2, Search, ChevronRight, CheckCircle2,
  Mail, Fingerprint, Loader2
} from 'lucide-react';
import type { User as UserType } from '@/lib/auth-types';
import { employeeService, type Employee } from '@/services/employee.service';
import { assetService, type AllocatedAsset } from '@/services/asset.service';
import { toast } from 'sonner';

interface CoreHRProps {
  user: UserType;
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
};


export function CoreHR({ user }: CoreHRProps) {
  const [activeTab, setActiveTab] = useState<CoreHRTab>('orgchart');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>(defaultEmployeeForm);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [departmentsData, setDepartmentsData] = useState<Array<{
    department: string;
    users: Employee[];
  }>>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoadingEmployeeDetail, setIsLoadingEmployeeDetail] = useState(false);
  const [allocatedAssets, setAllocatedAssets] = useState<AllocatedAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // State quản lý việc đóng/mở danh sách nhân sự trong phòng ban
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

  // Fetch employees theo department từ API
  useEffect(() => {
    fetchEmployeesByDepartment();
  }, []);


  const fetchEmployeesByDepartment = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await employeeService.getEmployeesByDepartment();
      setDepartmentsData(data);
    } catch (error: any) {
      console.error('Error fetching employees by department:', error);
      toast.error('Không thể tải sơ đồ tổ chức', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleViewEmployee = async (employeeId: string) => {
    setIsLoadingEmployeeDetail(true);
    try {
      // Thử tìm employee từ dữ liệu đã có trước
      let employee: Employee | undefined = undefined;
      
      // Tìm trong departmentsData (org chart)
      for (const group of departmentsData) {
        employee = group.users.find(u => u.id === employeeId);
        if (employee) break;
      }
      
      // Nếu không tìm thấy, tìm trong allEmployees (profile tab)
      if (!employee) {
        employee = allEmployees.find(u => u.id === employeeId);
      }
      
      // Nếu vẫn không tìm thấy, thử gọi API
      if (!employee) {
        try {
          employee = await employeeService.getEmployeeById(employeeId);
        } catch (apiError: any) {
          // Nếu API fail, vẫn thử tìm lại trong dữ liệu đã có
          console.warn('API call failed, using cached data:', apiError);
        }
      }
      
      if (employee) {
        setSelectedEmployee(employee);
        // Chuyển sang tab Profile khi xem chi tiết
        setActiveTab('profile');
        // Fetch assets cho employee này ngay lập tức (không await để không block UI)
        fetchEmployeeAssets(employeeId).catch(err => {
          console.warn('Failed to fetch assets:', err);
        });
      } else {
        throw new Error('Không tìm thấy thông tin nhân sự');
      }
    } catch (error: any) {
      console.error('Error fetching employee detail:', error);
      toast.error('Không thể tải thông tin nhân sự', {
        description: error.message || 'Vui lòng thử lại sau',
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
      
      // Log để debug
      if (assets && assets.length > 0) {
        console.log('Assets data:', JSON.stringify(assets, null, 2));
      } else {
        console.warn('No assets returned from API');
      }
    } catch (error: any) {
      console.error('❌ Error fetching allocated assets:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Nếu là lỗi quyền, vẫn set empty array nhưng log warning
      if (error.message?.includes('quyền') || error.message?.includes('permission') || error.message?.includes('403')) {
        console.warn('⚠️ No permission to view assets, showing empty state');
        setAllocatedAssets([]);
      } else {
        // Các lỗi khác vẫn set empty array
        console.warn('⚠️ Error occurred, showing empty state');
        setAllocatedAssets([]);
      }
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Fetch assets khi chuyển sang tab assets
  // Nếu có selectedEmployee thì fetch assets của employee đó
  // Nếu chưa có selectedEmployee thì fetch assets của user đang đăng nhập
  useEffect(() => {
    if (activeTab === 'assets') {
      if (selectedEmployee?.id) {
        // Có employee được chọn, fetch assets của employee đó
        fetchEmployeeAssets(selectedEmployee.id);
      } else if (user?.id) {
        // Chưa chọn employee, fetch assets của user đang đăng nhập
        console.log('No employee selected, fetching assets for logged-in user:', user.id);
        fetchEmployeeAssets(user.id);
      }
    }
  }, [activeTab, selectedEmployee?.id, user?.id]);

  // Build org chart từ API response
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

    // Tìm Ban Giám đốc (employees có position = CEO hoặc không có department)
    let ceoEmployees: Employee[] = [];
    let ceoManager = 'CEO';

    departmentsData.forEach(group => {
      const ceos = group.users.filter(u => u.position === 'CEO');
      if (ceos.length > 0) {
        ceoEmployees = ceoEmployees.concat(ceos);
        ceoManager = ceos[0].fullName || 'CEO';
      }
    });

    // Nếu không có CEO, tìm Manager đầu tiên
    if (ceoEmployees.length === 0) {
      departmentsData.forEach(group => {
        const managers = group.users.filter(u => u.position === 'Manager');
        if (managers.length > 0 && ceoManager === 'CEO') {
          ceoManager = managers[0].fullName || 'CEO';
        }
      });
    }

    // Tạo Ban Giám đốc
    if (ceoEmployees.length > 0 || departmentsData.length > 0) {
      departments.push({
        id: '1',
        name: 'Ban Giám đốc',
        manager: ceoManager,
        employees: ceoEmployees.length,
        level: 0,
        deptKey: 'CEO',
      });
    }

    // Tạo các phòng ban từ API response
    departmentsData.forEach((group, index) => {
      const deptName = group.department;
      const deptUsers = group.users;
      
      // Tìm manager (ưu tiên Manager, sau đó CEO)
      const manager = deptUsers.find(u => u.position === 'Manager')?.fullName ||
                      deptUsers.find(u => u.position === 'CEO')?.fullName ||
                      'Chưa có';

      departments.push({
        id: String(index + 2),
        name: `Phòng ${deptName}`,
        parent: '1',
        manager: manager,
        employees: deptUsers.length,
        level: 1,
        deptKey: deptName,
      });
    });

    return departments;
  }, [departmentsData]);

  // Flatten tất cả employees để dùng cho profile tab
  const employees = useMemo(() => {
    return departmentsData.flatMap(group => group.users);
  }, [departmentsData]);

  const tabs: { id: CoreHRTab; label: string; icon: typeof Building2 }[] = [
    { id: 'orgchart', label: 'Tổ chức', icon: Building2 },
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'assets', label: 'Tài sản', icon: Laptop },
  ];

  const isSystemAdmin = user.role === 'System Admin';

  // Fetch tất cả employees cho profile tab (nếu cần)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  
  const fetchAllEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      // Flatten department và role objects
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
      toast.error('Không thể tải danh sách nhân sự', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && isSystemAdmin) {
      fetchAllEmployees();
    }
  }, [activeTab, isSystemAdmin]);

  // Tự động load profile của user đang đăng nhập khi chưa chọn employee và ở tab profile
  useEffect(() => {
    if (activeTab === 'profile' && !selectedEmployee && user?.id) {
      console.log('No employee selected, loading profile for logged-in user:', user.id);
      // Gọi trực tiếp API để load profile, không dùng handleViewEmployee để tránh setActiveTab
      const loadUserProfile = async () => {
        setIsLoadingEmployeeDetail(true);
        try {
          let employee: Employee | undefined = undefined;
          
          // Tìm trong departmentsData (org chart)
          for (const group of departmentsData) {
            employee = group.users.find(u => u.id === user.id);
            if (employee) break;
          }
          
          // Nếu không tìm thấy, tìm trong allEmployees (profile tab)
          if (!employee) {
            employee = allEmployees.find(u => u.id === user.id);
          }
          
          // Nếu vẫn không tìm thấy, thử gọi API
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
      // Flatten department và role thành string để search
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
      ].filter(Boolean); // Loại bỏ null/undefined
      
      return searchValues.some((value) =>
        typeof value === 'string' && value.toLowerCase().includes(keyword)
      );
    });
  }, [employees, allEmployees, searchTerm, activeTab, isSystemAdmin]);

  const openAddModal = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(defaultEmployeeForm);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    // Flatten department và role thành string
    const deptStr = typeof emp.department === 'object' && emp.department !== null
      ? emp.department.name
      : emp.department || '';
    const roleStr = typeof emp.role === 'string' 
      ? emp.role 
      : (emp.role && typeof emp.role === 'object' ? emp.role.name : '') || '';
    
    setEmployeeForm({
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
    });
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) return;

    try {
      await employeeService.deleteEmployee(employeeId);
      toast.success('Xóa nhân sự thành công');
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
      toast.error('Không thể xóa nhân sự', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Partial<Employee> = {
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
      ...(employeeForm.password && { password: employeeForm.password }),
    };

    try {
    if (editingEmployeeId) {
        await employeeService.updateEmployee(editingEmployeeId, payload);
        toast.success('Cập nhật nhân sự thành công');
    } else {
        await employeeService.createEmployee(payload);
        toast.success('Tạo nhân sự mới thành công');
      }
    setIsModalOpen(false);
      // Refresh data
      await fetchEmployeesByDepartment();
      if (activeTab === 'profile' && isSystemAdmin) {
        await fetchAllEmployees();
      }
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(editingEmployeeId ? 'Không thể cập nhật nhân sự' : 'Không thể tạo nhân sự', {
        description: error.message || 'Vui lòng thử lại sau',
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
      {/* Header cải tiến */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-200">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Core HR</h2>
            <p className="text-slate-500 font-medium flex items-center gap-1.5 text-sm">
              <Fingerprint className="w-4 h-4 text-purple-500" />
              Quản lý định danh & hồ sơ tập trung
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
              <h3 className="text-lg font-bold text-slate-900">Sơ đồ tổ chức trực tuyến</h3>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-[10px] font-black uppercase">Cập nhật thực tế</span>
            </div>

            {isLoadingEmployees ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-slate-500">Đang tải sơ đồ tổ chức...</span>
              </div>
            ) : orgChart.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-[20px] p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Chưa có dữ liệu tổ chức</h4>
                <p className="text-slate-500 text-sm">Sơ đồ tổ chức sẽ được hiển thị khi có dữ liệu nhân sự.</p>
              </div>
            ) : (
            <div className="grid gap-4">
              {orgChart.map((dept) => {
                const isExpanded = expandedDepts.includes(dept.id);
                  // Lấy employees từ departmentsData
                  let deptEmps: Employee[] = [];
                  if (dept.deptKey === 'CEO') {
                    // Ban Giám đốc: lấy tất cả employees có position = CEO
                    departmentsData.forEach(group => {
                      const ceos = group.users.filter(u => u.position === 'CEO');
                      deptEmps = deptEmps.concat(ceos);
                    });
                  } else {
                    // Các phòng ban khác: lấy từ departmentsData
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
                            Quản lý: <span className="text-slate-900">{dept.manager}</span> • {dept.employees} nhân sự
                          </p>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-purple-50 text-purple-600 rotate-90' : 'text-slate-300'}`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Danh sách nhân sự chi tiết khi mở rộng */}
                    {isExpanded && (
                      <div className="ml-6 border-l-2 border-purple-100 pl-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        {isLoadingEmployees ? (
                          <div className="p-4 flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Đang tải...</span>
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
                                  {emp.position === 'Manager' ? 'QUẢN LÝ' : emp.position === 'CEO' ? 'CEO' : (emp.position || 'EMPLOYEE')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-mono text-slate-400">{emp.email || 'N/A'}</span>
                                <span className="text-[10px] font-bold text-slate-500">{emp.id}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEmployee(emp.id);
                                }}
                                className="p-2 hover:bg-purple-50 text-slate-300 hover:text-purple-600 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-xs text-slate-400 italic bg-slate-50/50 rounded-xl">Chưa có nhân sự trong phòng ban này</div>
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
              /* Hiển thị chi tiết nhân viên được chọn */
              <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                {isLoadingEmployeeDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-slate-500">Đang tải thông tin nhân sự...</span>
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
                        {showSensitiveData ? 'Ẩn thông tin' : 'Xem thông tin PII'}
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
                          {selectedEmployee.position === 'Manager' ? 'Quản lý' : 
                           selectedEmployee.position === 'CEO' ? 'CEO' : 
                           selectedEmployee.position || 
                           (typeof selectedEmployee.role === 'string' ? selectedEmployee.role : selectedEmployee.role?.name) || 
                           'Nhân viên'}
                        </h3>
                        <p className="text-slate-500 text-sm">{selectedEmployee.fullName}</p>
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Quay lại
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Cột 1: Thông tin cơ bản */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Mã nhân viên</div>
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
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Giới tính</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.gender === 'male' ? 'Nam' : selectedEmployee.gender === 'female' ? 'Nữ' : selectedEmployee.gender || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Ngày sinh</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Cột 2: Thông tin liên hệ */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Email công việc</div>
                          <p className="text-base font-bold text-slate-900">{selectedEmployee.email || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Số điện thoại
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            {showSensitiveData ? (selectedEmployee.phoneNumber || 'N/A') : maskData(selectedEmployee.phoneNumber || '')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Mã số thuế
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            {showSensitiveData ? (selectedEmployee.taxCode || 'N/A') : maskData(selectedEmployee.taxCode || '')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Địa chỉ</div>
                          <p className="text-base font-bold text-slate-900">{selectedEmployee.address || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Cột 3: Thông tin công việc */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Phòng ban</div>
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
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Chức vụ</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.position === 'Manager' ? 'Quản lý' : 
                             selectedEmployee.position === 'CEO' ? 'CEO' : 
                             selectedEmployee.position === 'Employee' ? 'Nhân viên' :
                             selectedEmployee.position || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Vai trò</div>
                          <p className="text-base font-bold text-slate-900">
                            {selectedEmployee.role && typeof selectedEmployee.role === 'object' 
                              ? selectedEmployee.role.name 
                              : (selectedEmployee.role || 'N/A')}
                          </p>
                          {selectedEmployee.role && typeof selectedEmployee.role === 'object' && selectedEmployee.role.description && (
                            <p className="text-xs text-slate-500 mt-1">{selectedEmployee.role.description}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Trạng thái</div>
                          <p className="text-base font-bold text-slate-900">
                            <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                              selectedEmployee.status === 'Active' || selectedEmployee.isActive
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
            ) : isSystemAdmin ? (
              <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                      placeholder="Tìm mã nhân viên, tên, phòng ban..."
                    />
                  </div>
                  <button
                    onClick={openAddModal}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-slate-200 active:scale-95 transition-all"
                  >                    <Plus className="w-4 h-4" /> Thêm nhân sự mới
                  </button>
                </div>
                {/* Table nhân sự giữ nguyên logic cũ nhưng làm đẹp CSS hơn */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.1em] border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">Nhân viên</th>
                        <th className="px-8 py-4">Phòng ban</th>
                        <th className="px-8 py-4">Chức vụ</th>
                        <th className="px-8 py-4 text-right">Hành động</th>
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
                          <td className="px-8 py-5 text-sm font-medium text-slate-600">
                            {typeof emp.role === 'object' && emp.role !== null
                              ? emp.role.name
                              : emp.role || 'N/A'}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEmployee(emp.id);
                                }}
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-purple-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(emp.id);
                                }}
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Giao diện xem hồ sơ cá nhân cho Employee (Giữ nguyên logic của bạn) */
              <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
                  <button onClick={() => setShowSensitiveData(!showSensitiveData)} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-purple-600 transition-all uppercase tracking-widest">
                    {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSensitiveData ? 'Ẩn thông tin' : 'Xem thông tin PII'}
                  </button>
                </div>
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center text-2xl font-black text-purple-600">
                    {(user.fullName && user.fullName.length > 0) ? user.fullName.charAt(0) : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{user.fullName || user.email || 'N/A'}</h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{user.role || 'N/A'} • {user.department || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {[
                    { label: 'Mã nhân viên', value: 'EMP-2024-001', icon: Fingerprint },
                    { label: 'Email công việc', value: user.email, icon: Mail },
                    { label: 'Số điện thoại', value: '0912345678', sensitive: true },
                    { label: 'CCCD/ID Number', value: '001234567890', sensitive: true },
                    { label: 'Mã số thuế', value: '8765432109', sensitive: true },
                    { label: 'Ngày gia nhập', value: '15/01/2020', icon: CheckCircle2 },
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
                  ? `Thiết bị được cấp phát - ${selectedEmployee.fullName}` 
                  : `Thiết bị được cấp phát - ${user.fullName || user.email}`}
              </h3>
              {!selectedEmployee && (
                <p className="text-sm text-slate-500">Đang hiển thị tài sản của bạn</p>
              )}
            </div>

            {selectedEmployee || user?.id ? (
              <>
                {isLoadingAssets ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-slate-500">Đang tải danh sách tài sản...</span>
                  </div>
                ) : allocatedAssets.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[24px] p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Laptop className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Chưa có tài sản được cấp phát</h4>
                    <p className="text-slate-500 text-sm">
                      {selectedEmployee 
                        ? 'Nhân viên này chưa được cấp phát thiết bị nào.' 
                        : 'Bạn chưa được cấp phát thiết bị nào.'}
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
                        ? 'Đang sử dụng' 
                        : allocatedAsset.status === 'returned'
                        ? 'Đã trả lại'
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
                            <span className="font-bold">Mã tài sản:</span> {asset.assetCode}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">
                            <span className="font-bold">Hãng:</span> {asset.brand} - {asset.model}
                          </p>
                          <p className="text-xs text-slate-500 mb-6">
                            <span className="font-bold">Loại:</span> {asset.category}
                          </p>
                          <div className="space-y-2 border-t border-slate-50 pt-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span>Cấp ngày</span>
                              <span className="text-slate-900">
                                {allocatedAsset.allocatedDate ? new Date(allocatedAsset.allocatedDate).toLocaleDateString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                            {allocatedAsset.returnedDate && (
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                <span>Trả lại</span>
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
                <h4 className="text-lg font-bold text-slate-900 mb-2">Không thể tải tài sản</h4>
                <p className="text-slate-500 text-sm">Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
            </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">{editingEmployeeId ? 'Sửa nhân sự' : 'Thêm nhân sự mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Đóng</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Mã nhân sự" value={employeeForm.id} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, id: value }))} placeholder="EMP-2024-001" />
              <FormField label="Họ và tên" value={employeeForm.fullName} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, fullName: value }))} required />
              <FormField label="Email" type="email" value={employeeForm.email} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, email: value }))} required />
              <FormField label="Mật khẩu" type="password" value={employeeForm.password} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, password: value }))} />
              <FormField label="Số điện thoại" value={employeeForm.phoneNumber} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, phoneNumber: value }))} required />
              <FormField label="Giới tính" value={employeeForm.gender} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, gender: value }))} placeholder="male/female/other" required />
              <FormField label="Ngày sinh" type="date" value={employeeForm.dateOfBirth} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, dateOfBirth: value }))} required />
              <FormField label="CCCD" value={employeeForm.citizen_Id} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, citizen_Id: value }))} required />
              <FormField label="Phòng ban" value={employeeForm.department} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, department: value }))} required />
              <FormField label="Chức vụ" value={employeeForm.position} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, position: value }))} required />
              <FormField label="Vai trò" value={employeeForm.role} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, role: value }))} required />
              <FormField label="Địa chỉ" value={employeeForm.address} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, address: value }))} required />
              <FormField label="Mã số thuế" value={employeeForm.taxCode} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, taxCode: value }))} required />
              <FormField label="Trạng thái" value={employeeForm.status} onChange={(value) => setEmployeeForm((prev) => ({ ...prev, status: value }))} required />
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={employeeForm.isActive}
                  onChange={(e) => setEmployeeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Đang hoạt động</label>
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">{editingEmployeeId ? 'Cập nhật' : 'Tạo mới'}</button>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
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
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </label>
  );
}
