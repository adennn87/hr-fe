"use client";

import React, { useMemo, useState } from 'react';
import {
  Users, Building2, User, Laptop, Lock, Eye, EyeOff,
  Plus, Pencil, Trash2, Search, ChevronRight, CheckCircle2,
  Mail, Fingerprint
} from 'lucide-react';
import type { User as UserType } from '@/lib/auth-types';

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

  // State quản lý việc đóng/mở danh sách nhân sự trong phòng ban
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);

  const [employees, setEmployees] = useState([
    { id: 'EMP-2024-001', fullName: 'Nguyễn Văn An', email: 'an.nv@hr.com.vn', department: 'IT', role: 'System Admin', phone: '0912345678' },
    { id: 'EMP-2024-014', fullName: 'Trần Thị Bình', email: 'binh.tt@hr.com.vn', department: 'HR', role: 'HR Manager', phone: '0988776655' },
    { id: 'EMP-2024-027', fullName: 'Phạm Thị Dung', email: 'dung.pt@hr.com.vn', department: 'Finance', role: 'Accountant', phone: '0900112233' },
    { id: 'EMP-2024-056', fullName: 'Lê Văn Cường', email: 'cuong.lv@hr.com.vn', department: 'Sales', role: 'Sales Lead', phone: '0933445566' },
  ]);

  const orgChart = [
    { id: '1', name: 'Ban Giám đốc', manager: 'CEO', employees: 3, level: 0, deptKey: 'Management' },
    { id: '2', name: 'Phòng IT', parent: '1', manager: 'Nguyễn Văn An', employees: 15, level: 1, deptKey: 'IT' },
    { id: '3', name: 'Phòng HR', parent: '1', manager: 'Trần Thị Bình', employees: 8, level: 1, deptKey: 'HR' },
    { id: '4', name: 'Phòng Sales', parent: '1', manager: 'Lê Văn Cường', employees: 25, level: 1, deptKey: 'Sales' },
    { id: '5', name: 'Phòng Finance', parent: '1', manager: 'Phạm Thị Dung', employees: 12, level: 1, deptKey: 'Finance' },
  ];

  const tabs: { id: CoreHRTab; label: string; icon: typeof Building2 }[] = [
    { id: 'orgchart', label: 'Tổ chức', icon: Building2 },
    { id: 'profile', label: 'Hồ sơ', icon: User },
    { id: 'assets', label: 'Tài sản', icon: Laptop },
  ];


  const isSystemAdmin = user.role === 'System Admin';

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return employees;
    return employees.filter((emp) =>
      [emp.id, emp.fullName, emp.department, emp.role].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
  }, [employees, searchTerm]);

  const openAddModal = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(defaultEmployeeForm);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: typeof employees[number]) => {
    setEditingEmployeeId(emp.id);
    setEmployeeForm({
      ...defaultEmployeeForm,
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      department: emp.department,
      position: emp.role,
      role: emp.role,
      phoneNumber: emp.phone,
    });
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...employeeForm,
      dateOfBirth: employeeForm.dateOfBirth ? new Date(employeeForm.dateOfBirth) : null,
    };

    if (editingEmployeeId) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployeeId
            ? {
              ...emp,
              fullName: employeeForm.fullName,
              email: employeeForm.email,
              department: employeeForm.department,
              role: employeeForm.role,
              phone: employeeForm.phoneNumber,
            }
            : emp
        )
      );
    } else {
      const generatedId = employeeForm.id.trim() || `EMP-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`;
      setEmployees((prev) => [
        ...prev,
        {
          id: generatedId,
          fullName: employeeForm.fullName,
          email: employeeForm.email,
          department: employeeForm.department,
          role: employeeForm.role,
          phone: employeeForm.phoneNumber,
        },
      ]);
    }

    console.log('CreateUserDto payload', payload);
    setIsModalOpen(false);
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
              <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-3 py-1">Cập nhật thực tế</Badge>
            </div>

            <div className="grid gap-4">
              {orgChart.map((dept) => {
                const isExpanded = expandedDepts.includes(dept.id);
                const deptEmps = employees.filter(e => e.department === dept.deptKey);

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
                        {deptEmps.length > 0 ? deptEmps.map(emp => (
                          <div key={emp.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                {emp.fullName.split(' ').pop()?.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">{emp.fullName}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{emp.role}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-mono text-slate-400">{emp.email}</span>
                                <span className="text-[10px] font-bold text-slate-500">{emp.id}</span>
                              </div>
                              <button className="p-2 hover:bg-purple-50 text-slate-300 hover:text-purple-600 rounded-lg transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-xs text-slate-400 italic bg-slate-50/50 rounded-xl">Dữ liệu nhân sự chi tiết đang được đồng bộ...</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {isSystemAdmin ? (
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
                        <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-xs font-mono text-slate-400">{emp.id}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black">{emp.department}</span>
                          </td>
                          <td className="px-8 py-5 text-sm font-medium text-slate-600">{emp.role}</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-purple-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
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
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{user.name}</h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{user.role} • {user.department}</p>
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

        {/* --- ASSETS TAB (Làm đẹp lại theo phong cách Grid) --- */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 px-2">Thiết bị được cấp phát</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tabs.map((asset) => (
                <div key={asset.id} className="bg-white border border-slate-200 rounded-[24px] p-6 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px]">Sẵn sàng sử dụng</Badge>
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-1">{asset.model}</h4>
                  <p className="text-xs font-mono text-slate-400 mb-6">SN: {asset.serial}</p>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase border-t border-slate-50 pt-4">
                    <span>Cấp ngày</span>
                    <span className="text-slate-900">{asset.assignedDate}</span>
                  </div>
                </div>
              ))}
            </div>
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

// Custom Badge component
function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${className}`}>
      {children}
    </span>
  );
}