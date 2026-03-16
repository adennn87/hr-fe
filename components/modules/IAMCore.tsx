"use client";

import React, { useState } from 'react';
import { Shield, Lock, Save, Plus, Briefcase, Key, ChevronRight } from 'lucide-react';
import { User } from '@/lib/auth-types';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IAMCoreProps {
  user: User;
}

export function IAMCore({ user }: IAMCoreProps) {
  const [activeTab, setActiveTab] = useState<'authz'>('authz');
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const permissionGroups = [
    {
      group: "Nhân sự (Core HR)",
      perms: [
        { id: "hr:read", label: "Xem hồ sơ nhân sự", desc: "Cho phép xem thông tin cơ bản của nhân viên" },
        { id: "hr:write", label: "Cập nhật thông tin", desc: "Sửa đổi thông tin cá nhân, hợp đồng" },
        { id: "hr:delete", label: "Lưu trữ/Xóa hồ sơ", desc: "Lưu trữ hồ sơ cũ hoặc xóa dữ liệu nhân sự" }
      ]
    },
    {
      group: "Tài chính & Lương (Finance)",
      perms: [
        { id: "payroll:read", label: "Xem bảng lương hệ thống", desc: "Xem chi tiết bảng lương các phòng ban" },
        { id: "payroll:write", label: "Phê duyệt chi trả lương", desc: "Xác nhận lệnh chuyển tiền lương hàng tháng" },
        { id: "finance:report", label: "Xuất báo cáo tài chính", desc: "Trích xuất dữ liệu phục vụ quyết toán" },
      ]
    }
  ];



  const [rbacRoles, setRbacRoles] = useState([
    { role: 'System Administrator', users: 2, permissions: ['all_access'], description: 'Toàn quyền quản trị hệ thống và cấu hình hạ tầng.' },
    { role: 'HR Manager', users: 3, permissions: ['hr:write'], description: 'Quản lý toàn bộ nhân sự.' },
    { 
      role: 'Accountant', 
      users: 4, 
      permissions: ['payroll:read', 'payroll:write', 'finance:report', 'biometric:verify'], 
      description: 'Chịu trách nhiệm quyết toán thuế, quản lý dòng tiền và phê duyệt lương.' 
    },
    { role: 'Employee', users: 250, permissions: ['self:profile'], description: 'Nhân viên chính thức, truy cập hồ sơ và bảng lương cá nhân.' },
  ]);

  const handleOpenConfig = (role: any) => {
    setSelectedRole(role);
    setIsConfigOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-soft">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Management</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-sm text-slate-500 font-medium">Hệ thống Zero Trust đang hoạt động</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/60">
          
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'authz' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Vai trò người dùng (RBAC)</h3>
                <p className="text-sm text-slate-500">Quản lý các nhóm quyền dựa trên chức năng nghiệp vụ.</p>
              </div>
              <Button onClick={() => setIsAddRoleOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 h-10 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" /> Tạo vai trò
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rbacRoles.map((role, index) => (
                <div key={index} 
                  onClick={() => handleOpenConfig(role)}
                  className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                      <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {role.role}
                      </h4>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        {role.users} IDs
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
                      {role.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-50">
                    {role.permissions.slice(0, 3).map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider">
                        {p.replace(':', ' ')}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-[9px] font-bold text-slate-400 self-center">+{role.permissions.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- SHEET THIẾT LẬP QUYỀN TỐI ƯU --- */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent className="sm:max-w-md p-0 border-l border-slate-200">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 border-b border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-slate-900">Ma trận quyền hạn</SheetTitle>
                  <SheetDescription className="text-blue-600 font-semibold flex items-center gap-1.5 text-xs">
                    <Key className="w-3 h-3" /> Vai trò: {selectedRole?.role}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
              {permissionGroups.map((group) => (
                <div key={group.group} className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 bg-white py-2 z-10">
                    {group.group}
                  </h5>
                  <div className="grid gap-2">
                    {group.perms.map((perm) => (
                      <div key={perm.id} className="group flex items-start gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                        <Checkbox 
                          id={perm.id} 
                          defaultChecked={selectedRole?.permissions.includes(perm.id) || selectedRole?.permissions.includes('all_access')}
                          className="mt-1 w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor={perm.id} className="flex-1 cursor-pointer space-y-1">
                          <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{perm.label}</div>
                          <div className="text-[11px] text-slate-500 leading-snug">{(perm as any).desc}</div>
                          <div className="text-[9px] text-slate-300 font-mono uppercase tracking-tighter pt-1">{perm.id}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="p-6 bg-slate-50 border-t border-slate-200">
              <Button onClick={() => setIsConfigOpen(false)} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                <Save className="w-4 h-4" /> Xác nhận cập nhật
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white">
             <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">Tạo cấu trúc vai trò</DialogTitle>
                <p className="text-slate-400 text-sm mt-1">Định nghĩa một nhóm đặc quyền mới cho hệ thống.</p>
             </DialogHeader>
          </div>
          <div className="p-8 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên định danh vai trò</Label>
              <Input placeholder="Ví dụ: Kế toán trưởng..." className="h-11 rounded-lg border-slate-200 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả đặc quyền</Label>
              <Input placeholder="Mục đích của vai trò này..." className="h-11 rounded-lg border-slate-200 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kế thừa cấu hình</Label>
              <div className="relative">
                <select className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-slate-50/50">
                  <option value="">-- Tạo mới hoàn toàn (Mặc định) --</option>
                  {rbacRoles.map(r => <option key={r.role} value={r.role}>{r.role}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="rounded-xl h-11 font-bold flex-1 text-slate-500 hover:bg-slate-100" onClick={() => setIsAddRoleOpen(false)}>Hủy</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-bold flex-[2] text-white" onClick={() => {
                setIsAddRoleOpen(false);
                setIsConfigOpen(true);
              }}>
                Tiếp tục thiết lập
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}