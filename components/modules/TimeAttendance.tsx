"use client";

import React, { useState } from 'react';
import { Clock, Calendar, MapPin, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface TimeAttendanceProps {
  user: User;
}

export function TimeAttendance({ user }: TimeAttendanceProps) {
  const [activeTab, setActiveTab] = useState<'checkin' | 'leave' | 'schedule'>('checkin');
  const [checkInStatus, setCheckInStatus] = useState<'not_checked' | 'checking' | 'success' | 'blocked'>('not_checked');

  // Mock attendance data
  const attendanceRecords = [
    { id: '1', date: '2024-02-09', checkIn: '08:45', checkOut: '17:30', status: 'present', location: 'Office - Hanoi' },
    { id: '2', date: '2024-02-08', checkIn: '08:50', checkOut: '17:35', status: 'present', location: 'Office - Hanoi' },
    { id: '3', date: '2024-02-07', checkIn: '09:15', checkOut: '17:40', status: 'late', location: 'Office - Hanoi' },
    { id: '4', date: '2024-02-06', checkIn: '08:40', checkOut: '17:25', status: 'present', location: 'Office - Hanoi' },
    { id: '5', date: '2024-02-05', checkIn: '-', checkOut: '-', status: 'absent', location: '-' },
  ];

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
            <h2 className="text-2xl font-bold text-gray-900">Time & Attendance</h2>
          </div>
          <p className="text-gray-600">
            Chấm công & Nghỉ phép - Kiểm soát ngữ cảnh chống giả mạo
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'checkin', label: 'Chấm công', icon: UserCheck },
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

      {/* Tab Content */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          {/* Check-in Widget */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-4xl font-bold text-orange-600">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {checkInStatus === 'not_checked' && (
              <button
                onClick={handleCheckIn}
                className="w-full py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-lg font-semibold"
              >
                Check In
              </button>
            )}

            {checkInStatus === 'checking' && (
              <div className="text-center py-4">
                <div className="animate-spin w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600">Đang xác minh vị trí và thiết bị...</p>
              </div>
            )}

            {checkInStatus === 'success' && (
              <div className="text-center py-4">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-3" />
                <p className="text-xl font-semibold text-green-600 mb-1">Check-in thành công!</p>
                <p className="text-sm text-gray-600">08:45 - Office Hanoi</p>
              </div>
            )}

            {checkInStatus === 'blocked' && (
              <div className="text-center py-4">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-3" />
                <p className="text-xl font-semibold text-red-600 mb-1">Check-in bị chặn!</p>
                <p className="text-sm text-gray-600">GPS không khớp với văn phòng hoặc IP không hợp lệ</p>
              </div>
            )}
          </div>

          {/* Context Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Vị trí</span>
              </div>
              <p className="text-sm text-gray-600">21.028511, 105.804817</p>
              <p className="text-xs text-green-600 mt-1">✓ Trong phạm vi văn phòng</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Giờ làm việc</span>
              </div>
              <p className="text-sm text-gray-600">08:00 - 17:00</p>
              <p className="text-xs text-green-600 mt-1">✓ Trong giờ cho phép</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Trạng thái</span>
              </div>
              <p className="text-sm text-gray-600">Đã check-in</p>
              <p className="text-xs text-gray-500 mt-1">Lúc 08:45</p>
            </div>
          </div>

          {/* Attendance History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử chấm công</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check In</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check Out</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vị trí</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.checkIn}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.checkOut}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.location}</td>
                      <td className="px-4 py-3 text-sm">
                        {record.status === 'present' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Có mặt</span>
                        )}
                        {record.status === 'late' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Đi muộn</span>
                        )}
                        {record.status === 'absent' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Vắng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900">
                <p className="font-semibold mb-1">Zero Trust Control: Context-Aware Access</p>
                <p className="text-orange-700">
                  Chặn check-in nếu GPS không khớp với tọa độ văn phòng (Geofencing) hoặc IP không nằm trong 
                  Whitelist (đối với nhân viên làm tại chỗ). Ngăn chặn gian lận chấm công.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
