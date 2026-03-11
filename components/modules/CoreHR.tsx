"use client";

import React, { useMemo, useState } from 'react';
import { 
  Users, Building2, User, Laptop, Lock, Eye, EyeOff, 
  Plus, Pencil, Trash2, Search, ChevronRight, CheckCircle2,
  ChevronDown, Mail, Fingerprint
} from 'lucide-react';
import type { User as UserType } from '@/lib/auth-types';

interface CoreHRProps {
  user: UserType;
}

export function CoreHR({ user }: CoreHRProps) {
  const [activeTab, setActiveTab] = useState<'orgchart' | 'profile' | 'assets'>('orgchart');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const isSystemAdmin = user.role === 'System Admin';

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
          {[
            { id: 'orgchart', label: 'Tổ chức', icon: Building2 },
            { id: 'profile', label: 'Hồ sơ', icon: User },
            { id: 'assets', label: 'Tài sản', icon: Laptop },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
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
                      className={`group flex items-center justify-between p-5 bg-white border rounded-[20px] transition-all cursor-pointer ${
                        isExpanded ? 'border-purple-400 shadow-lg shadow-purple-50 ring-1 ring-purple-100' : 'border-slate-100 hover:border-purple-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          dept.level === 0 || isExpanded ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600'
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
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-slate-200 active:scale-95 transition-all">
                        <Plus className="w-4 h-4" /> Thêm nhân sự mới
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
                      {employees.map((emp) => (
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
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-purple-600"><Pencil className="w-4 h-4" /></button>
                                <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              {assets.map((asset) => (
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
    </div>
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