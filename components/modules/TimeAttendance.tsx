"use client";

import React, { useState } from 'react';
import { Clock, Calendar, MapPin, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface TimeAttendanceProps {
  user: User;
}

export function TimeAttendance({ user }: TimeAttendanceProps) {
  const [activeTab, setActiveTab] = useState< 'leave' | 'schedule'>('leave');
  const [checkInStatus, setCheckInStatus] = useState<'not_checked' | 'checking' | 'success' | 'blocked'>('not_checked');



  // Mock leave requests
  const leaveRequests = [
    { id: '1', type: 'Nghỉ phép năm', from: '2024-02-15', to: '2024-02-16', days: 2, status: 'approved', reason: 'Việc cá nhân' },
    { id: '2', type: 'Nghỉ ốm', from: '2024-01-20', to: '2024-01-20', days: 1, status: 'approved', reason: 'Khám bác sĩ' },
    { id: '3', type: 'Nghỉ phép năm', from: '2024-01-08', to: '2024-01-12', days: 5, status: 'approved', reason: 'Du lịch' },
  ];

  const leaveBalance = {
    annual: { total: 12, used: 7, remaining: 5 },
    sick: { total: 12, used: 1, remaining: 11 },
  };

  // Mock schedule
  const weekSchedule = [
    { day: 'Thứ 2', date: '05/02', shift: 'Sáng (08:00 - 17:00)', status: 'scheduled' },
    { day: 'Thứ 3', date: '06/02', shift: 'Sáng (08:00 - 17:00)', status: 'scheduled' },
    { day: 'Thứ 4', date: '07/02', shift: 'Sáng (08:00 - 17:00)', status: 'scheduled' },
    { day: 'Thứ 5', date: '08/02', shift: 'Sáng (08:00 - 17:00)', status: 'scheduled' },
    { day: 'Thứ 6', date: '09/02', shift: 'Sáng (08:00 - 17:00)', status: 'today' },
  ];

  const handleCheckIn = () => {
    setCheckInStatus('checking');
    
    // Simulate context-aware access check
    setTimeout(() => {
      // Mock: Check if location matches office
      const isValidLocation = true; // In real app, check GPS
      const isValidIP = true; // In real app, check IP whitelist
      
      if (isValidLocation && isValidIP) {
        setCheckInStatus('success');
      } else {
        setCheckInStatus('blocked');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Work Schedule & Leave</h2>
          </div>
          <p className="text-gray-600">
            Lịch làm việc và quản lý nghỉ phép.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'leave', label: 'Quản lý nghỉ phép', icon: Calendar },
            { id: 'schedule', label: 'Xếp ca làm việc', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
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


      

      {activeTab === 'leave' && (
        <div className="space-y-4">
          {/* Leave Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Phép năm</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Tổng số ngày</span>
                <span className="font-bold text-2xl text-blue-600">{leaveBalance.annual.total}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Đã sử dụng</span>
                <span className="font-medium text-gray-900">{leaveBalance.annual.used}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Còn lại</span>
                <span className="font-bold text-xl text-green-600">{leaveBalance.annual.remaining}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Phép ốm</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Tổng số ngày</span>
                <span className="font-bold text-2xl text-green-600">{leaveBalance.sick.total}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Đã sử dụng</span>
                <span className="font-medium text-gray-900">{leaveBalance.sick.used}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Còn lại</span>
                <span className="font-bold text-xl text-green-600">{leaveBalance.sick.remaining}</span>
              </div>
            </div>
          </div>

          {/* Leave Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Đơn xin nghỉ</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                + Tạo đơn mới
              </button>
            </div>

            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{request.type}</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {request.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {request.from} - {request.to} ({request.days} ngày)
                      </p>
                      <p className="text-sm text-gray-500">Lý do: {request.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Lịch làm việc tuần này</h3>

          <div className="space-y-2">
            {weekSchedule.map((schedule, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 ${
                  schedule.status === 'today'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 text-center ${
                      schedule.status === 'today' ? 'text-orange-600 font-bold' : 'text-gray-600'
                    }`}>
                      <p className="text-xs">{schedule.day}</p>
                      <p className="text-lg font-semibold">{schedule.date}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{schedule.shift}</p>
                      {schedule.status === 'today' && (
                        <p className="text-xs text-orange-600 font-medium">Hôm nay</p>
                      )}
                    </div>
                  </div>
                  {schedule.status === 'today' && (
                    <Clock className="w-6 h-6 text-orange-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {user.role === 'System Admin' || user.role === 'HR Manager' ? (
            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Quản lý lịch ca làm việc
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
