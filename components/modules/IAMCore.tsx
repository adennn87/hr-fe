"use client";

import React, { useState } from 'react';
import { Shield, Users, Key, Lock, Activity, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface IAMCoreProps {
  user: User;
}

export function IAMCore({ user }: IAMCoreProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'auth' | 'authz'>('identity');

  // Mock data
  const identities = [
    { id: '1', name: 'Nguyễn Văn An', email: 'admin@company.vn', status: 'active', department: 'IT', syncSource: 'Google Workspace' },
    { id: '2', name: 'Trần Thị Bình', email: 'hr@company.vn', status: 'active', department: 'HR', syncSource: 'Microsoft 365' },
    { id: '3', name: 'Lê Văn Cường', email: 'employee@company.vn', status: 'active', department: 'Sales', syncSource: 'Manual' },
    { id: '4', name: 'Phạm Thị Dung', email: 'dung@company.vn', status: 'suspended', department: 'Finance', syncSource: 'Google Workspace' },
  ];

  const policies = [
    {
      id: '1',
      name: 'Chặn truy cập từ thiết bị không tin cậy',
      type: 'Device Health',
      condition: 'deviceHealth != "healthy"',
      action: 'DENY',
      priority: 'High'
    },
    {
      id: '2',
      name: 'Yêu cầu MFA cho Module C&B',
      type: 'Context-Based',
      condition: 'module == "Compensation" && mfa == false',
      action: 'REQUIRE_MFA',
      priority: 'Critical'
    },
    {
      id: '3',
      name: 'Giới hạn truy cập ngoài giờ',
      type: 'Time-Based',
      condition: 'time < 08:00 || time > 18:00',
      action: 'ALERT',
      priority: 'Medium'
    },
    {
      id: '4',
      name: 'Chặn IP nước ngoài',
      type: 'Location-Based',
      condition: 'location != "Vietnam"',
      action: 'DENY',
      priority: 'High'
    },
  ];

  const rbacRoles = [
    {
      role: 'System Administrator',
      users: 2,
      permissions: ['all_access'],
      description: 'Toàn quyền quản trị hệ thống và cấu hình hạ tầng.'
    },
    {
      role: 'HR Director',
      users: 3,
      permissions: ['hr:write', 'payroll:read', 'recruitment:manage'],
      description: 'Quản lý toàn bộ nhân sự và xem báo cáo lương cao cấp.'
    },
    {
      role: 'Payroll Specialist',
      users: 5,
      permissions: ['payroll:write', 'compensation:manage', 'biometric:verify'],
      description: 'Chuyên viên xử lý lương, yêu cầu xác thực sinh trắc học khi duyệt.'
    },
    {
      role: 'Department Manager',
      users: 15,
      permissions: ['team:read', 'leave:approve', 'performance:review'],
      description: 'Quản lý trực tiếp, phê duyệt nghỉ phép và đánh giá nhân viên.'
    },
    {
      role: 'Regular Employee',
      users: 250,
      permissions: ['self:profile', 'self:attendance', 'self:payslip'],
      description: 'Nhân viên chính thức, truy cập hồ sơ cá nhân và bảng lương.'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">IAM Core</h2>
          </div>
          <p className="text-gray-600">
            Định danh & Quản lý Truy cập - "Trái tim" của hệ thống Zero Trust
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'identity', label: 'Quản lý Định danh', icon: Users },
            { id: 'authz', label: 'Ủy quyền (AuthZ)', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'identity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">User Directory</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phòng ban</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nguồn đồng bộ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {identities.map((identity) => (
                  <tr key={identity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{identity.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{identity.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{identity.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {identity.syncSource}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {identity.status === 'active' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          Suspended
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'auth' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Zero Trust Control</p>
                <p className="text-blue-700">
                  MFA/2FA bắt buộc cho tất cả người dùng. Hỗ trợ WebAuthn/FIDO2
                  cho trải nghiệm passwordless an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'authz' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Phân quyền dựa trên vai trò (RBAC)</h3>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
              + Thêm vai trò
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rbacRoles.map((role, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-900 text-base">{role.role}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                        {role.users} nhân viên
                      </span>
                    </div>
                    {/* Hiển thị thêm mô tả công việc của vai trò */}
                    <p className="text-sm text-gray-500 italic leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Thiết lập quyền
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  {role.permissions.map((permission, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-mono font-medium rounded border border-indigo-100 uppercase tracking-wider"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
