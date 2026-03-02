"use client";

import React, { useState } from 'react';
import { Shield, Users, Key, Lock, Activity, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface IAMCoreProps {
  user: User;
}

export function IAMCore({ user }: IAMCoreProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'auth' | 'authz' | 'policies'>('identity');

  // Mock data
  const identities = [
    { id: '1', name: 'Nguyễn Văn An', email: 'admin@company.vn', status: 'active', department: 'IT', syncSource: 'Google Workspace' },
    { id: '2', name: 'Trần Thị Bình', email: 'hr@company.vn', status: 'active', department: 'HR', syncSource: 'Microsoft 365' },
    { id: '3', name: 'Lê Văn Cường', email: 'employee@company.vn', status: 'active', department: 'Sales', syncSource: 'Manual' },
    { id: '4', name: 'Phạm Thị Dung', email: 'dung@company.vn', status: 'suspended', department: 'Finance', syncSource: 'Google Workspace' },
  ];

  const authMethods = [
    { method: 'SSO (Single Sign-On)', enabled: true, users: 145, success: 99.2 },
    { method: 'MFA (Multi-Factor)', enabled: true, users: 145, success: 98.5 },
    { method: 'WebAuthn/FIDO2', enabled: true, users: 23, success: 100 },
    { method: 'Passwordless', enabled: true, users: 23, success: 100 },
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
    { role: 'System Admin', users: 5, permissions: ['*'] },
    { role: 'HR Manager', users: 8, permissions: ['hr:*', 'employee:read'] },
    { role: 'HR Staff', users: 12, permissions: ['employee:read', 'leave:manage'] },
    { role: 'Employee', users: 120, permissions: ['self:read', 'self:update'] },
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
            { id: 'auth', label: 'Xác thực (AuthN)', icon: Key },
            { id: 'authz', label: 'Ủy quyền (AuthZ)', icon: Lock },
            { id: 'policies', label: 'Policy Engine', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
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
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Thêm người dùng
            </button>
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
          <h3 className="text-lg font-semibold text-gray-900">Phương thức xác thực</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authMethods.map((method, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{method.method}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    method.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {method.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người dùng:</span>
                    <span className="font-medium text-gray-900">{method.users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tỷ lệ thành công:</span>
                    <span className="font-medium text-green-600">{method.success}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Zero Trust Control</p>
                <p className="text-blue-700">
                  MFA/2FA bắt buộc cho tất cả người dùng. Hỗ trợ WebAuthn/FIDO2 (vân tay, FaceID, YubiKey) 
                  cho trải nghiệm passwordless an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'authz' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Phân quyền RBAC</h3>
          
          <div className="space-y-3">
            {rbacRoles.map((role, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{role.role}</h4>
                    <p className="text-sm text-gray-600">{role.users} người dùng</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Chỉnh sửa
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-semibold mb-1">RBAC + ABAC Hybrid</p>
                <p className="text-purple-700">
                  Phân quyền tĩnh theo Role (RBAC) kết hợp với phân quyền động theo thuộc tính (ABAC). 
                  VD: HR Staff chỉ xem được lương của nhân viên thuộc Department = IT VÀ Location = Hanoi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Security Policies</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Thêm Policy
            </button>
          </div>

          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{policy.name}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        policy.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        policy.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {policy.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{policy.type}</p>
                    <div className="bg-gray-50 rounded p-2 font-mono text-xs text-gray-700">
                      {policy.condition}
                    </div>
                  </div>
                  <span className={`ml-4 px-3 py-1 text-sm font-medium rounded ${
                    policy.action === 'DENY' ? 'bg-red-100 text-red-700' :
                    policy.action === 'REQUIRE_MFA' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {policy.action}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Policy Engine thời gian thực</p>
                <p className="text-amber-700">
                  Đánh giá rủi ro dựa trên ngữ cảnh (IP, thiết bị, thời gian, vị trí) để cấp quyền động. 
                  Mọi request đều được kiểm tra trước khi cho phép truy cập.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
