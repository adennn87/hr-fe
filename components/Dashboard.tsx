"use client";
import React, { useState } from 'react';
import { Shield, Users, DollarSign, Clock, UserPlus, Settings, Activity } from 'lucide-react';
import { IAMCore } from './modules/IAMCore';
import { CoreHR } from './modules/CoreHR';
import { CompensationBenefits } from './modules/CompensationBenefits';
import { TimeAttendance } from './modules/TimeAttendance';
import { ATS } from './modules/ATS';
import { AdminAudit } from './modules/AdminAudit';
import { User, SecurityContextData } from '@/lib/auth-types';

interface DashboardProps {
  user: User;
  securityContext: SecurityContextData;
}

type ModuleType = 'overview' | 'iam' | 'coreHR' | 'compensation' | 'time' | 'ats' | 'admin';

export function Dashboard({ user, securityContext }: DashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');

  const modules = [
    {
      id: 'iam' as ModuleType,
      name: 'IAM Core',
      description: 'Quản lý định danh & truy cập',
      icon: Shield,
      color: 'blue',
      roles: ['System Admin', 'HR Manager']
    },
    {
      id: 'coreHR' as ModuleType,
      name: 'Hồ sơ & Tổ chức',
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
      roles: ['System Admin', 'HR Manager', 'Employee']
    },
    {
      id: 'time' as ModuleType,
      name: 'Chấm công & Nghỉ phép',
      description: 'Time & Attendance',
      icon: Clock,
      color: 'orange',
      roles: ['System Admin', 'HR Manager', 'Employee']
    },
    {
      id: 'ats' as ModuleType,
      name: 'Tuyển dụng',
      description: 'ATS - Applicant Tracking',
      icon: UserPlus,
      color: 'pink',
      roles: ['System Admin', 'HR Manager']
    },
    {
      id: 'admin' as ModuleType,
      name: 'Quản trị & Giám sát',
      description: 'Admin & Audit',
      icon: Activity,
      color: 'red',
      roles: ['System Admin']
    }
  ];

  const accessibleModules = modules.filter(module => 
    module.roles.includes(user.role)
  );

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
      case 'ats':
        return <ATS user={user} />;
      case 'admin':
        return <AdminAudit user={user} />;
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Xin chào, {user.name}!
              </h2>
              <p className="text-gray-600">
                Chào mừng đến với Hệ thống HR Zero Trust. Chọn một phân hệ để bắt đầu.
              </p>
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
                <p className="text-3xl font-bold">{accessibleModules.length}</p>
                <p className="text-xs opacity-75 mt-1">Phân hệ được phép</p>
              </div>
            </div>

            {/* Modules Grid */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân hệ của bạn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessibleModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`bg-white border-2 border-${module.color}-200 hover:border-${module.color}-400 rounded-xl p-6 text-left transition-all hover:shadow-lg group`}
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-${module.color}-100 rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 text-${module.color}-600`} />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{module.name}</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-1">Zero Trust Active</p>
                  <p className="text-amber-700">
                    Mọi hành động đang được giám sát và ghi nhận vào audit log. 
                    Quyền truy cập được đánh giá liên tục dựa trên ngữ cảnh (IP: {securityContext.ipAddress}, Vị trí: {securityContext.location}).
                  </p>
                </div>
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
