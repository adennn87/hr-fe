"use client";

import React, { useState } from 'react';
import { Activity, FileText, Settings, Shield, Lock, Eye, AlertTriangle } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface AdminAuditProps {
  user: User;
}

export function AdminAudit({ user }: AdminAuditProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'policies' | 'integrations'>('audit');

  // Mock audit logs
  const auditLogs = [
    {
      id: '1',
      timestamp: '2024-02-09 14:32:15',
      user: 'Nguyễn Văn An',
      action: 'VIEW_PAYSLIP',
      resource: 'Employee: EMP-2024-001',
      ip: '103.28.36.124',
      location: 'Hanoi',
      status: 'success',
      risk: 'low',
    },
    {
      id: '2',
      timestamp: '2024-02-09 14:28:42',
      user: 'Trần Thị Bình',
      action: 'EXPORT_SALARY',
      resource: 'Module: Compensation',
      ip: '103.28.36.125',
      location: 'Hanoi',
      status: 'success',
      risk: 'high',
    },
    {
      id: '3',
      timestamp: '2024-02-09 14:15:33',
      user: 'Unknown',
      action: 'FAILED_LOGIN',
      resource: 'User: admin@company.vn',
      ip: '45.123.45.67',
      location: 'Singapore',
      status: 'blocked',
      risk: 'critical',
    },
    {
      id: '4',
      timestamp: '2024-02-09 13:45:12',
      user: 'Lê Văn Cường',
      action: 'UPDATE_PROFILE',
      resource: 'Self',
      ip: '103.28.36.126',
      location: 'Ho Chi Minh',
      status: 'success',
      risk: 'low',
    },
    {
      id: '5',
      timestamp: '2024-02-09 13:30:05',
      user: 'Nguyễn Văn An',
      action: 'CREATE_USER',
      resource: 'Employee: EMP-2024-145',
      ip: '103.28.36.124',
      location: 'Hanoi',
      status: 'success',
      risk: 'medium',
    },
  ];

  // Mock security policies
  const securityPolicies = [
    {
      id: '1',
      category: 'Authentication',
      policies: [
        { name: 'MFA Required', enabled: true, description: 'Bắt buộc MFA cho tất cả người dùng' },
        { name: 'Password Complexity', enabled: true, description: 'Mật khẩu tối thiểu 12 ký tự, chữ hoa, số, ký tự đặc biệt' },
        { name: 'Session Timeout', enabled: true, description: 'Tự động đăng xuất sau 30 phút không hoạt động' },
      ],
    },
    {
      id: '2',
      category: 'Access Control',
      policies: [
        { name: 'RBAC Enabled', enabled: true, description: 'Phân quyền dựa trên vai trò (Role-Based Access Control)' },
        { name: 'Least Privilege', enabled: true, description: 'Chỉ cấp quyền tối thiểu cần thiết' },
        { name: 'IP Whitelist', enabled: true, description: 'Chỉ cho phép truy cập từ IP được phê duyệt' },
      ],
    },
    {
      id: '3',
      category: 'Data Protection',
      policies: [
        { name: 'Field Encryption', enabled: true, description: 'Mã hóa dữ liệu nhạy cảm (CMND, Lương, Thuế)' },
        { name: 'Audit Logging', enabled: true, description: 'Ghi log tất cả thao tác trên hệ thống' },
        { name: 'Data Masking', enabled: true, description: 'Che dữ liệu nhạy cảm khi hiển thị' },
      ],
    },
  ];

  // Mock integrations
  const integrations = [
    {
      id: '1',
      name: 'Google Workspace',
      type: 'Identity Sync',
      status: 'active',
      lastSync: '2024-02-09 14:00',
      users: 145,
    },
    {
      id: '2',
      name: 'Vietcombank API',
      type: 'Payment Gateway',
      status: 'active',
      lastSync: '2024-02-09 09:30',
      transactions: 1250,
    },
    {
      id: '3',
      name: 'Cloudflare WARP',
      type: 'VPN/Zero Trust Network',
      status: 'active',
      lastSync: '2024-02-09 14:30',
      devices: 89,
    },
    {
      id: '4',
      name: 'Slack',
      type: 'Notifications',
      status: 'inactive',
      lastSync: '-',
      messages: 0,
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'blocked':
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin & Audit</h2>
          </div>
          <p className="text-gray-600">
            Quản trị & Giám sát
          </p>
        </div>
      </div>

      {/* Admin-only Warning */}
      {user.role !== 'System Admin' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-bold mb-1">⚠️ Quyền truy cập bị hạn chế</p>
              <p className="text-red-700">
                Bạn không có quyền System Admin. Chỉ có thể xem một phần thông tin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'audit', label: 'Audit Logging', icon: FileText },
            { id: 'policies', label: 'Security Policies', icon: Shield },
            { id: 'integrations', label: 'Integrations/API', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
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
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Nhật ký kiểm toán</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Lọc
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Thời gian</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Người dùng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Hành động</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Tài nguyên</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">IP / Vị trí</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Rủi ro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-600">{log.timestamp}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">{log.user}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{log.resource}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {log.ip}<br />
                        <span className="text-gray-500">{log.location}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${getRiskColor(log.risk)}`}>
                          {log.risk.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Tổng sự kiện hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm text-red-600 mb-1">Cảnh báo cao</p>
              <p className="text-2xl font-bold text-red-600">3</p>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <p className="text-sm text-orange-600 mb-1">Đăng nhập thất bại</p>
              <p className="text-2xl font-bold text-orange-600">12</p>
            </div>
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <p className="text-sm text-green-600 mb-1">Tình trạng hệ thống</p>
              <p className="text-2xl font-bold text-green-600">Tốt</p>
            </div>
          </div>          
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Cấu hình chính sách bảo mật</h3>

          <div className="space-y-4">
            {securityPolicies.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  {category.category}
                </h4>
                <div className="space-y-3">
                  {category.policies.map((policy, index) => (
                    <div key={index} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">{policy.name}</h5>
                          {policy.enabled && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Enabled
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input type="checkbox" checked={policy.enabled} readOnly className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tích hợp bên thứ 3</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Thêm tích hợp
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                      <p className="text-sm text-gray-600">{integration.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(integration.status)}`}>
                    {integration.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last sync:</span>
                    <span className="text-gray-900">{integration.lastSync}</span>
                  </div>
                  {integration.users && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Users synced:</span>
                      <span className="text-gray-900">{integration.users}</span>
                    </div>
                  )}
                  {integration.transactions && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="text-gray-900">{integration.transactions}</span>
                    </div>
                  )}
                  {integration.devices && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Devices:</span>
                      <span className="text-gray-900">{integration.devices}</span>
                    </div>
                  )}
                </div>
                <button className="w-full mt-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Cấu hình
                </button>
              </div>
            ))}
          </div>

         

          {/* API Keys Management */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              API Keys Management
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Quản lý API keys cho webhooks và tích hợp bên thứ 3. Mỗi key có scope và expiration riêng.
            </p>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Quản lý API Keys →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
