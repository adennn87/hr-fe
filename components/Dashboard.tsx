"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, DollarSign, Clock, UserPlus, Settings, Activity } from 'lucide-react';
import { IAMCore } from './modules/IAMCore';
import { CoreHR } from './modules/CoreHR';
import { CompensationBenefits } from './modules/CompensationBenefits';
import { TimeAttendance } from './modules/TimeAttendance';
import { User, SecurityContextData } from '@/lib/auth-types';
import { getJwtRoleInfo, isAdminRoleId, normalizeRoleId } from '@/lib/role-utils';

interface DashboardProps {
  user: User;
  securityContext: SecurityContextData;
}

type ModuleType = 'overview' | 'iam' | 'coreHR' | 'compensation' | 'time' | 'ats' | 'admin';

export function Dashboard({ user, securityContext }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');
  const router = useRouter();
  const fullName = (user.fullName || (user as any).full_name || '').trim();
  const displayName = fullName || user.email?.split('@')[0] || 'User';

  const modules = [
    {
      id: 'iam' as ModuleType,
      name: 'Access Management',
      description: 'Quản lý định danh',
      icon: Shield,
      color: 'blue',
      roles: ['System Admin', 'HR Manager']
    },
    {
      id: 'coreHR' as ModuleType,
      name: 'Profile & Organization',
      description: 'Core HR',
      icon: Users,
      color: 'purple',
      roles: ['System Admin', 'HR Manager', 'Employee']
    },
    {
      id: 'compensation' as ModuleType,
      name: 'Lương & Phúc lợi',
      description: 'C&B - Khu vực rủi ro cao',
      icon: DollarSign,
      color: 'green',
      roles: ['System Admin','Accountant',  'HR Manager', 'Employee']
    },
    {
      id: 'time' as ModuleType,
      name: 'Lịch làm việc & Nghỉ phép',
      description: 'Work Schedule & Leave',
      icon: Clock,
      color: 'orange',
      roles: ['System Admin', 'HR Manager', 'Employee']
    },

  ];

  // Helper function để normalize role name
  const normalizeRole = (role: any): string => {
    if (!role) return '';
    if (typeof role === 'object' && role.name) return role.name;
    const roleStr = typeof role === 'string' ? role : String(role);
    return roleStr.trim();
  };

  // Helper function để check role match (case-insensitive và flexible matching)
  const hasAccess = (moduleRoles: string[], userRole: any): boolean => {
    const normalizedUserRole = normalizeRole(userRole).toLowerCase();
    return moduleRoles.some(moduleRole => {
      const normalizedModuleRole = normalizeRole(moduleRole).toLowerCase();
      // Exact match
      if (normalizedUserRole === normalizedModuleRole) return true;
      // Partial match (e.g., "admin" matches "System Admin")
      if (normalizedUserRole.includes('admin') && normalizedModuleRole.includes('admin')) return true;
      if (normalizedUserRole.includes('manager') && normalizedModuleRole.includes('manager')) return true;
      if (normalizedUserRole.includes('employee') && normalizedModuleRole.includes('employee')) return true;
      // Match các biến thể khác
      if ((normalizedUserRole === 'admin' || normalizedUserRole === 'system admin') && normalizedModuleRole.includes('admin')) return true;
      if ((normalizedUserRole === 'hr manager' || normalizedUserRole === 'manager') && normalizedModuleRole.includes('manager')) return true;
      return false;
    });
  };

  const accessibleModules = modules.filter(module =>
    hasAccess(module.roles, user.role)
  );

  // isAdmin được tính trên client sau khi hydrate để tránh hydration mismatch
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const jwtRole = getJwtRoleInfo();
      if (jwtRole.roleId) {
        setIsAdmin(isAdminRoleId(jwtRole.roleId));
        return;
      }

      // Fallback: user.role có thể đang là roleId UUID
      const fallbackRoleId = normalizeRoleId(user.role);
      setIsAdmin(isAdminRoleId(fallbackRoleId));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, [user.role]);

  // Nếu không có module nào match, hiển thị tất cả (fallback)
  // Hoặc có thể hiển thị message cảnh báo
  const finalAccessibleModules = accessibleModules.length > 0 ? accessibleModules : modules;

  // Debug logging để kiểm tra
  if (accessibleModules.length === 0) {
    console.warn('⚠️ No modules matched for role:', user.role);
    console.log('Available roles in modules:', modules.flatMap(m => m.roles));
    console.log('Showing all modules as fallback');
  } else {
    console.log('✅ User role:', user.role, '→ Accessible modules:', accessibleModules.length);
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'iam':
        return <IAMCore user={user} />;
      case 'coreHR':
        return <CoreHR user={user} />;
      case 'compensation':
        return <CompensationBenefits user={user} />;
      case 'time':
        return <TimeAttendance user={user} />;
      default:  
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {displayName}!
              </h2>
              {isAdmin && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/register')}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tạo tài khoản mới
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Phiên đang hoạt động</span>
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">1</p>
                <p className="text-xs opacity-75 mt-1">Từ {securityContext.deviceType}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Điểm bảo mật</span>
                  <Shield className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{100 - securityContext.riskScore}%</p>
                <p className="text-xs opacity-75 mt-1">Rủi ro thấp</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Quyền truy cập</span>
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{finalAccessibleModules.length}</p>
                <p className="text-xs opacity-75 mt-1">Phân hệ được phép</p>
              </div>
            </div>

            {/* Modules Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân hệ của bạn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {finalAccessibleModules.map((module) => {
                  const Icon = module.icon;
                  // Map color to Tailwind classes để tránh dynamic class issues
                  const colorClasses = {
                    blue: {
                      border: 'border-blue-200 hover:border-blue-400',
                      bg: 'bg-blue-100',
                      text: 'text-blue-600'
                    },
                    purple: {
                      border: 'border-purple-200 hover:border-purple-400',
                      bg: 'bg-purple-100',
                      text: 'text-purple-600'
                    },
                    green: {
                      border: 'border-green-200 hover:border-green-400',
                      bg: 'bg-green-100',
                      text: 'text-green-600'
                    },
                    orange: {
                      border: 'border-orange-200 hover:border-orange-400',
                      bg: 'bg-orange-100',
                      text: 'text-orange-600'
                    },
                    pink: {
                      border: 'border-pink-200 hover:border-pink-400',
                      bg: 'bg-pink-100',
                      text: 'text-pink-600'
                    },
                    red: {
                      border: 'border-red-200 hover:border-red-400',
                      bg: 'bg-red-100',
                      text: 'text-red-600'
                    }
                  };
                  const colors = colorClasses[module.color as keyof typeof colorClasses] || colorClasses.blue;
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`bg-white border-2 ${colors.border} rounded-xl p-6 text-left transition-all hover:shadow-lg group cursor-pointer`}
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 ${colors.bg} rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Navigation */}
      {activeModule !== 'overview' && (
        <div className="mb-6">
          <button
            onClick={() => setActiveModule('overview')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            ← Quay lại Dashboard
          </button>
        </div>
      )}

      {/* Module Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {renderModule()}
      </div>
    </div>
  );
}
