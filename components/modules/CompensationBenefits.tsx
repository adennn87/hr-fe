"use client";

import React, { useState } from 'react';
import { DollarSign, FileText, Heart, Shield, Lock, AlertTriangle } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface CompensationBenefitsProps {
  user: User;
}

export function CompensationBenefits({ user }: CompensationBenefitsProps) {
  const [activeTab, setActiveTab] = useState<'salary' | 'payslip' | 'benefits'>('salary');
  const [requireStepUp, setRequireStepUp] = useState(false);
  const [stepUpVerified, setStepUpVerified] = useState(false);

  // Mock salary data
  const salaryData = {
    baseSalary: 25000000,
    allowances: 5000000,
    bonuses: 3000000,
    totalGross: 33000000,
    insurance: 3300000,
    tax: 2970000,
    totalDeductions: 6270000,
    netSalary: 26730000,
  };

  // Mock payslips
  const payslips = [
    { id: '1', month: '01/2024', status: 'paid', amount: 26730000, paidDate: '2024-01-31' },
    { id: '2', month: '12/2023', status: 'paid', amount: 26730000, paidDate: '2023-12-31' },
    { id: '3', month: '11/2023', status: 'paid', amount: 25500000, paidDate: '2023-11-30' },
  ];

  // Mock benefits
  const benefits = [
    {
      id: '1',
      name: 'Bảo hiểm y tế cao cấp',
      type: 'Health Insurance',
      provider: 'Bảo Việt',
      coverage: '500,000,000 VNĐ/năm',
      status: 'active',
    },
    {
      id: '2',
      name: 'Bảo hiểm nhân thọ',
      type: 'Life Insurance',
      provider: 'Prudential',
      coverage: '1,000,000,000 VNĐ',
      status: 'active',
    },
    {
      id: '3',
      name: 'Khám sức khỏe định kỳ',
      type: 'Health Checkup',
      provider: 'Vinmec',
      coverage: 'Gói Premium',
      status: 'scheduled',
    },
  ];

  const handleViewPayslip = (payslipId: string) => {
    // Simulate step-up authentication requirement
    setRequireStepUp(true);
  };

  const handleStepUpAuth = () => {
    // Simulate MFA verification
    setTimeout(() => {
      setStepUpVerified(true);
      setRequireStepUp(false);
      alert('Phiếu lương đã được tải về (được mã hóa bằng mật khẩu riêng)');
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Compensation & Benefits</h2>
          </div>
          <p className="text-gray-600">
            Lương & Phúc lợi - Khu vực rủi ro cao nhất (High Impact)
          </p>
        </div>
      </div>

      

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'salary', label: 'Tính lương & Thuế', icon: DollarSign },
            { id: 'payslip', label: 'Phiếu lương', icon: FileText },
            { id: 'benefits', label: 'Phúc lợi & Bảo hiểm', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
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
      {activeTab === 'salary' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết lương tháng 02/2024</h3>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Gross Salary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Thu nhập</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Lương cơ bản</span>
                  <span className="font-medium text-gray-900">{formatCurrency(salaryData.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Phụ cấp</span>
                  <span className="font-medium text-gray-900">{formatCurrency(salaryData.allowances)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Thưởng</span>
                  <span className="font-medium text-gray-900">{formatCurrency(salaryData.bonuses)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="font-semibold text-gray-900">Tổng thu nhập</span>
                  <span className="font-bold text-green-600">{formatCurrency(salaryData.totalGross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Khấu trừ</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Bảo hiểm (XH + YT + TN)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(salaryData.insurance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Thuế TNCN</span>
                  <span className="font-medium text-gray-900">{formatCurrency(salaryData.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-200">
                  <span className="font-semibold text-gray-900">Tổng khấu trừ</span>
                  <span className="font-bold text-orange-600">{formatCurrency(salaryData.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Thực nhận</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(salaryData.netSalary)}</span>
              </div>
            </div>
          </div>

          {user.role === 'System Admin' || user.role === 'HR Manager' ? (
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Chốt lương (Yêu cầu Step-up Auth)
              </button>
              <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Xuất file chuyển khoản (Yêu cầu Step-up Auth)
              </button>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'payslip' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Lịch sử phiếu lương</h3>

          <div className="space-y-3">
            {payslips.map((payslip) => (
              <div key={payslip.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Phiếu lương tháng {payslip.month}</h4>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(payslip.amount)} • Đã thanh toán {payslip.paidDate}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewPayslip(payslip.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Xem phiếu lương
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'benefits' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Gói phúc lợi của bạn</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    benefit.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {benefit.status === 'active' ? 'Đang hoạt động' : 'Đã lên lịch'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{benefit.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{benefit.type}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Nhà cung cấp: {benefit.provider}</p>
                  <p>Mức bảo hiểm: {benefit.coverage}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Khám sức khỏe định kỳ</h4>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Lịch khám sắp tới</p>
                  <p className="text-sm text-gray-600">25/03/2024 - 09:00 AM</p>
                  <p className="text-sm text-gray-600">Vinmec Times City, Hà Nội</p>
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-up Authentication Modal */}
      {requireStepUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Yêu cầu xác thực bổ sung
              </h3>
              <p className="text-gray-600">
                Để xem phiếu lương, vui lòng xác thực lại bằng MFA
              </p>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Nhập mã MFA (6 số)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRequireStepUp(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleStepUpAuth}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
