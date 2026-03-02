"use client";

import React, { useState } from 'react';
import { Users, Building2, User, Laptop, Lock, Eye, EyeOff } from 'lucide-react';
import type { User as UserType } from '@/lib/auth-types';

interface CoreHRProps {
  user: UserType;
}

export function CoreHR({ user }: CoreHRProps) {
  const [activeTab, setActiveTab] = useState<'orgchart' | 'profile' | 'assets'>('orgchart');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Mock org structure
  const orgChart = [
    { id: '1', name: 'Ban Giám đốc', parent: null, employees: 3, manager: 'CEO' },
    { id: '2', name: 'Phòng IT', parent: '1', employees: 15, manager: 'Nguyễn Văn An' },
    { id: '3', name: 'Phòng HR', parent: '1', employees: 8, manager: 'Trần Thị Bình' },
    { id: '4', name: 'Phòng Sales', parent: '1', employees: 25, manager: 'Lê Văn Cường' },
    { id: '5', name: 'Phòng Finance', parent: '1', employees: 12, manager: 'Phạm Thị Dung' },
  ];

  // Mock employee profile
  const employeeProfile = {
    personalInfo: {
      fullName: user.name,
      email: user.email,
      phone: '0912345678',
      dateOfBirth: '1990-05-15',
      gender: 'Nam',
      idNumber: '001234567890', // Sensitive
      taxCode: '8765432109', // Sensitive
      address: '123 Đường ABC, Quận 1, TP.HCM', // Sensitive
    },
    employment: {
      employeeId: 'EMP-2024-001',
      department: user.department,
      position: user.role,
      startDate: '2020-01-15',
      contractType: 'Hợp đồng lao động không xác định thời hạn',
      manager: 'Trần Thị Bình',
    },
  };

  // Mock assets
  const assets = [
    {
      id: '1',
      type: 'Laptop',
      model: 'MacBook Pro 16" M3',
      serial: 'MBP2024-001',
      assignedDate: '2024-01-15',
      status: 'healthy',
      lastCheck: '2024-02-01',
    },
    {
      id: '2',
      type: 'Monitor',
      model: 'Dell UltraSharp 27"',
      serial: 'DELL-MON-456',
      assignedDate: '2024-01-15',
      status: 'healthy',
      lastCheck: '2024-02-01',
    },
    {
      id: '3',
      type: 'Headset',
      model: 'Sony WH-1000XM5',
      serial: 'SONY-HS-789',
      assignedDate: '2024-01-20',
      status: 'healthy',
      lastCheck: '2024-02-01',
    },
  ];

  const maskSensitiveData = (data: string) => {
    if (showSensitiveData) return data;
    if (data.length <= 4) return '****';
    return '*'.repeat(data.length - 4) + data.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Core HR</h2>
          </div>
          <p className="text-gray-600">
            Quản lý Hồ sơ & Tổ chức - Nơi chứa dữ liệu PII nhạy cảm
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'orgchart', label: 'Sơ đồ tổ chức', icon: Building2 },
            { id: 'profile', label: 'Hồ sơ nhân sự', icon: User },
            { id: 'assets', label: 'Tài sản cấp phát', icon: Laptop },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
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
      {activeTab === 'orgchart' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Organizational Chart</h3>

          <div className="space-y-2">
            {orgChart.map((dept) => (
              <div
                key={dept.id}
                className={`border border-gray-200 rounded-lg p-4 ${
                  dept.parent ? 'ml-8' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                      <p className="text-sm text-gray-600">
                        Quản lý: {dept.manager} • {dept.employees} nhân viên
                      </p>
                    </div>
                  </div>
                  <button className="text-sm text-purple-600 hover:text-purple-700">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-semibold mb-1">Zero Trust Control: Need-to-know</p>
                <p className="text-purple-700">
                  Dữ liệu hiển thị dựa trên "Need-to-know". Nhân viên thường chỉ thấy tên/email đồng nghiệp, 
                  không thấy số điện thoại cá nhân hay địa chỉ nhà trừ khi được cho phép.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Hồ sơ cá nhân</h3>
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showSensitiveData ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm">Ẩn dữ liệu nhạy cảm</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Hiện dữ liệu nhạy cảm</span>
                </>
              )}
            </button>
          </div>

          {/* Personal Information */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Thông tin cá nhân</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Họ và tên</label>
                <p className="font-medium text-gray-900">{employeeProfile.personalInfo.fullName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{employeeProfile.personalInfo.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Số điện thoại</label>
                <p className="font-medium text-gray-900">{maskSensitiveData(employeeProfile.personalInfo.phone)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Ngày sinh</label>
                <p className="font-medium text-gray-900">{employeeProfile.personalInfo.dateOfBirth}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Giới tính</label>
                <p className="font-medium text-gray-900">{employeeProfile.personalInfo.gender}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  CMND/CCCD
                  <Lock className="w-3 h-3 text-red-500" />
                </label>
                <p className="font-medium text-gray-900">{maskSensitiveData(employeeProfile.personalInfo.idNumber)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  Mã số thuế
                  <Lock className="w-3 h-3 text-red-500" />
                </label>
                <p className="font-medium text-gray-900">{maskSensitiveData(employeeProfile.personalInfo.taxCode)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 flex items-center gap-1">
                  Địa chỉ
                  <Lock className="w-3 h-3 text-red-500" />
                </label>
                <p className="font-medium text-gray-900">
                  {showSensitiveData ? employeeProfile.personalInfo.address : '••••••••••••••••••'}
                </p>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Thông tin công việc</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Mã nhân viên</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.employeeId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phòng ban</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.department}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Vị trí</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.position}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Ngày bắt đầu</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.startDate}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Loại hợp đồng</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.contractType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Quản lý trực tiếp</label>
                <p className="font-medium text-gray-900">{employeeProfile.employment.manager}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-semibold mb-1">Zero Trust Control: Field-level Encryption</p>
                <p className="text-red-700">
                  Mã hóa cấp độ trường dữ liệu cho số CMND/CCCD, mã số thuế, địa chỉ. 
                  Chỉ người có quyền mới có thể xem dữ liệu gốc. Mọi truy cập được ghi audit log.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tài sản được cấp phát</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Laptop className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {asset.status === 'healthy' ? 'Bình thường' : 'Cảnh báo'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{asset.model}</h4>
                <p className="text-sm text-gray-600 mb-3">SN: {asset.serial}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Cấp phát: {asset.assignedDate}</p>
                  <p>Kiểm tra: {asset.lastCheck}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Laptop className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Zero Trust Control: Device Health Integration</p>
                <p className="text-blue-700">
                  Tích hợp trạng thái thiết bị (Device Health). Nếu thiết bị được đánh dấu "Mất" hoặc 
                  "Nhiễm virus", quyền truy cập hệ thống của nhân viên đó bị chặn tự động.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
