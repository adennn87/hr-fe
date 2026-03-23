"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Save, Plus, Briefcase, Key, ChevronRight, Loader2, Info, Users, CheckCircle2, Edit3, X, Search } from 'lucide-react';
import { User } from '@/lib/auth-types';
import { toast } from 'sonner';

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
import { roleService, type RoleFunction, type RoleWithUsers, type RoleDetail } from '@/services/role.service';
import { cn } from '@/components/ui/utils';
import { usePermissions } from '@/lib/use-permissions';

interface IAMCoreProps {
  user: User;
}

export function IAMCore({ user }: IAMCoreProps) {
  const [activeTab, setActiveTab] = useState<'authz'>('authz');
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithUsers | null>(null);
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<RoleDetail | null>(null);
  const { hasPermission } = usePermissions();

  // Real data state
  const [rbacRoles, setRbacRoles] = useState<RoleWithUsers[]>([]);
  const [functions, setFunctions] = useState<RoleFunction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [functionSearchQuery, setFunctionSearchQuery] = useState('');
  const [editFunctionSearchQuery, setEditFunctionSearchQuery] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    functionIds: [] as string[]
  });

  // Create Form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    functionIds: [] as string[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, functionsData] = await Promise.all([
        roleService.getRolesWithUsers(),
        roleService.getFunctions()
      ]);
      setRbacRoles(rolesData);
      setFunctions(functionsData);
    } catch (error: any) {
      console.error('Error fetching IAM data:', error);
      toast.error('Không thể tải dữ liệu phân quyền');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = React.useMemo(() => {
    if (!searchQuery.trim()) return rbacRoles;
    const lower = searchQuery.toLowerCase().trim();
    return rbacRoles.filter(r => r.name.toLowerCase().includes(lower));
  }, [rbacRoles, searchQuery]);

  const filteredFunctions = React.useMemo(() => {
    if (!functionSearchQuery.trim()) return functions;
    const lower = functionSearchQuery.toLowerCase().trim();
    return functions.filter(f => 
      f.name.toLowerCase().includes(lower) || 
      f.code.toLowerCase().includes(lower)
    );
  }, [functions, functionSearchQuery]);

  const filteredEditFunctions = React.useMemo(() => {
    if (!editFunctionSearchQuery.trim()) return functions;
    const lower = editFunctionSearchQuery.toLowerCase().trim();
    return functions.filter(f => 
       f.name.toLowerCase().includes(lower) || 
       f.code.toLowerCase().includes(lower)
    );
  }, [functions, editFunctionSearchQuery]);

  const handleOpenConfig = async (role: RoleWithUsers) => {
    setSelectedRole(role);
    setSelectedRoleDetail(null);
    setIsConfigOpen(true);
    setIsEditing(false);
    setIsLoadingDetail(true);
    try {
      const detail = await roleService.getRoleDetail(role.id);
      setSelectedRoleDetail(detail);
      // Pre-fill edit form
      setEditForm({
        name: detail.name,
        description: detail.description || '',
        functionIds: detail.roleFunctions.map(rf => rf.function.id)
      });
    } catch (error: any) {
      console.error('Error fetching role detail:', error);
      toast.error('Không thể tải chi tiết vai trò');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const toggleFunctionId = (id: string, isEdit = false) => {
    const setter = isEdit ? setEditForm : setRoleForm;
    setter((prev: any) => {
      const exists = prev.functionIds.includes(id);
      if (exists) {
        return { ...prev, functionIds: prev.functionIds.filter((fid: string) => fid !== id) };
      } else {
        return { ...prev, functionIds: [...prev.functionIds, id] };
      }
    });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) {
      toast.error('Vui lòng nhập tên vai trò');
      return;
    }
    if (roleForm.functionIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chức năng');
      return;
    }

    setIsSubmitting(true);
    try {
      await roleService.createRole({
        name: roleForm.name,
        description: roleForm.description,
        functionIds: roleForm.functionIds
      });
      toast.success('Tạo vai trò thành công');
      setIsAddRoleOpen(false);
      setRoleForm({ name: '', description: '', functionIds: [] });
      setFunctionSearchQuery('');
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Lỗi khi tạo vai trò');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !editForm.name) {
      toast.error('Vui lòng nhập tên vai trò');
      return;
    }

    setIsSubmitting(true);
    try {
      await roleService.updateRole(selectedRole.id, {
        name: editForm.name,
        description: editForm.description,
        functionIds: editForm.functionIds
      });
      toast.success('Cập nhật vai trò thành công');
      setIsEditing(false);
      
      // Refresh current detail
      setIsLoadingDetail(true);
      const detail = await roleService.getRoleDetail(selectedRole.id);
      setSelectedRoleDetail(detail);
      setEditForm({
        name: detail.name,
        description: detail.description || '',
        functionIds: detail.roleFunctions.map(rf => rf.function.id)
      });
      setIsLoadingDetail(false);
      
      fetchData(); // Refresh main list
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setIsSubmitting(false);
    }
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
              <p className="text-sm text-slate-500 font-medium">Hệ thống phân quyền đang hoạt động</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'authz' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Vai trò người dùng (RBAC)</h3>
                <p className="text-sm text-slate-500">Quản lý các nhóm quyền dựa trên chức năng nghiệp vụ.</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                   <Input 
                    placeholder="Tìm kiếm vai trò..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-slate-200 focus:ring-blue-500 shadow-sm"
                   />
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                {hasPermission('ROLE_CREATE') && (
                  <Button 
                    onClick={() => setIsAddRoleOpen(true)} 
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 h-10 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tạo vai trò
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles.map((role) => (
                  <div key={role.id} 
                    onClick={() => handleOpenConfig(role)}
                    className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                        <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-lg">
                          {role.name}
                        </h4>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          {role.users.length} Users
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
                        ID: {role.id.split('-')[0]}...
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 italic text-[10px] text-slate-400 flex items-center gap-1.5">
                       <Info className="w-3 h-3" /> Click để xem chi tiết & Cập nhật
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ROLE DETAIL & CONFIG SHEET */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent className="sm:max-w-xl p-0 border-l border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-900 p-8 text-white shrink-0">
            <SheetHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-white tracking-tight">
                      {isEditing ? 'Chỉnh sửa vai trò' : 'Chi tiết vai trò'}
                    </SheetTitle>
                    <SheetDescription className="text-blue-400 font-bold flex items-center gap-2 text-sm mt-1">
                      <Key className="w-4 h-4" /> {selectedRole?.name}
                    </SheetDescription>
                  </div>
                </div>
                {!isEditing && !isLoadingDetail && selectedRoleDetail && hasPermission('ROLE_UPDATE') && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsEditing(true)}
                    className="bg-transparent border-slate-700 text-white hover:bg-slate-800 rounded-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
                {isEditing && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsEditing(false)}
                    className="bg-transparent border-slate-700 text-white hover:bg-slate-800 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar bg-white">
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-400">
                 <Loader2 className="w-10 h-10 animate-spin" />
                 <p className="text-sm font-medium">Đang tải cấu hình...</p>
              </div>
            ) : selectedRoleDetail ? (
              <>
                {isEditing ? (
                  /* EDIT MODE */
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên vai trò</Label>
                        <Input 
                          value={editForm.name}
                          onChange={e => setEditForm(p => ({...p, name: e.target.value}))}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</Label>
                        <Input 
                          value={editForm.description}
                          onChange={e => setEditForm(p => ({...p, description: e.target.value}))}
                          className="h-11 rounded-xl border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Cập nhật quyền ({editForm.functionIds.length})</Label>
                      </div>

                      <div className="relative">
                        <Input 
                          placeholder="Tìm chức năng..." 
                          value={editFunctionSearchQuery}
                          onChange={e => setEditFunctionSearchQuery(e.target.value)}
                          className="h-9 rounded-lg border-slate-100 bg-slate-50 text-xs px-9 shadow-inner"
                        />
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEditFunctions.map((fn) => (
                          <div 
                            key={fn.id} 
                            onClick={() => toggleFunctionId(fn.id, true)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                              editForm.functionIds.includes(fn.id) 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-white border-slate-100 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={editForm.functionIds.includes(fn.id)} 
                                onCheckedChange={() => toggleFunctionId(fn.id, true)}
                                className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <div>
                                <p className={cn("text-xs font-bold", editForm.functionIds.includes(fn.id) ? "text-blue-700" : "text-slate-700")}>{fn.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{fn.code}</p>
                              </div>
                            </div>
                            {editForm.functionIds.includes(fn.id) && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="animate-in fade-in duration-500 space-y-8">
                    {/* Info Section */}
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Thông tin cơ bản</h5>
                       <div className="grid gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Mô tả</Label>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                              {selectedRoleDetail.description || 'Chưa có mô tả chi tiết.'}
                            </p>
                          </div>
                       </div>
                    </div>

                    {/* Users Section */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người dùng ({selectedRoleDetail.users.length})</h5>
                         <Users className="w-3.5 h-3.5 text-slate-300" />
                       </div>
                       <div className="grid gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {selectedRoleDetail.users.length > 0 ? (
                            selectedRoleDetail.users.map((u: any) => (
                              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{u.fullName.slice(0, 1)}</div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{u.fullName}</p>
                                    <p className="text-[10px] text-slate-400">{u.email}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{u.position}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic py-2 text-center">Chưa có người dùng nào được gán vai trò này.</p>
                          )}
                       </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                         <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chức năng gán quyền ({selectedRoleDetail.roleFunctions.length})</h5>
                         <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedRoleDetail.roleFunctions.map((rf) => (
                          <div key={rf.id} className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/20 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-wider">{rf.function.code}</span>
                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">{rf.function.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <SheetFooter className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
            {isEditing ? (
              <div className="flex gap-3 w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-200"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  onClick={handleUpdateRole} 
                  disabled={isSubmitting}
                  className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-blue-100"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsConfigOpen(false)} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl gap-2 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
                 Đóng chi tiết
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* CREATE ROLE DIALOG */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[24px]">
          <div className="bg-slate-900 p-8 text-white shrink-0">
             <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">Tạo vai trò & Gán quyền</DialogTitle>
                <p className="text-slate-400 text-sm mt-1">Định nghĩa vai trò mới và chọn các chức năng hệ thống được phép truy cập.</p>
             </DialogHeader>
          </div>

          <form onSubmit={handleCreateRole} className="flex-1 overflow-hidden flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên định danh vai trò</Label>
                  <Input 
                    required 
                    value={roleForm.name}
                    onChange={e => setRoleForm(p => ({...p, name: e.target.value}))}
                    placeholder="Ví dụ: Kế toán trưởng..." 
                    className="h-11 rounded-xl border-slate-200 focus:ring-blue-600 shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả mục đích</Label>
                  <Input 
                    value={roleForm.description}
                    onChange={e => setRoleForm(p => ({...p, description: e.target.value}))}
                    placeholder="Quản lý lương, tài sản..." 
                    className="h-11 rounded-xl border-slate-200 focus:ring-blue-600 shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Danh sách chức năng</Label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Đã chọn {roleForm.functionIds.length}
                  </span>
                </div>

                <div className="relative">
                   <Input 
                    placeholder="Tìm kiếm chức năng (tên hoặc mã)..." 
                    value={functionSearchQuery}
                    onChange={e => setFunctionSearchQuery(e.target.value)}
                    className="h-9 rounded-lg border-slate-100 bg-slate-50/50 text-xs focus:ring-blue-500 px-9"
                   />
                   <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredFunctions.map((fn) => (
                    <div 
                      key={fn.id} 
                      onClick={() => toggleFunctionId(fn.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        roleForm.functionIds.includes(fn.id) 
                          ? "bg-blue-50/50 border-blue-200 shadow-sm shadow-blue-100/50" 
                          : "bg-white border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <Checkbox 
                        checked={roleForm.functionIds.includes(fn.id)} 
                        onCheckedChange={() => toggleFunctionId(fn.id)}
                        className="mt-1 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-bold transition-colors",
                          roleForm.functionIds.includes(fn.id) ? "text-blue-700" : "text-slate-700"
                        )}>
                          {fn.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{fn.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
               <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl h-11 font-bold flex-1 text-slate-500 hover:bg-slate-200" 
                onClick={() => setIsAddRoleOpen(false)}
               >
                 Hủy
               </Button>
               <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-bold flex-[2] text-white shadow-lg shadow-blue-100"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận tạo vai trò'}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}