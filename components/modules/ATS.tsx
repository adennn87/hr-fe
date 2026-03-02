"use client";

import React, { useState } from 'react';
import { UserPlus, Briefcase, Calendar, Users, AlertCircle, Clock } from 'lucide-react';
import { User } from '@/lib/auth-types';

interface ATSProps {
  user: User;
}

export function ATS({ user }: ATSProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'interviews'>('jobs');

  // Mock job postings
  const jobPostings = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      department: 'IT',
      location: 'Hanoi',
      type: 'Full-time',
      status: 'active',
      applicants: 45,
      postedDate: '2024-01-15',
    },
    {
      id: '2',
      title: 'HR Specialist',
      department: 'HR',
      location: 'Ho Chi Minh',
      type: 'Full-time',
      status: 'active',
      applicants: 28,
      postedDate: '2024-01-20',
    },
    {
      id: '3',
      title: 'Sales Executive',
      department: 'Sales',
      location: 'Da Nang',
      type: 'Full-time',
      status: 'closed',
      applicants: 67,
      postedDate: '2024-01-05',
    },
  ];

  // Mock candidates
  const candidates = [
    {
      id: '1',
      name: 'Hoàng Văn Nam',
      email: 'nam@email.com',
      phone: '0912345678',
      position: 'Senior Frontend Developer',
      status: 'screening',
      appliedDate: '2024-02-01',
      experience: '5 years',
    },
    {
      id: '2',
      name: 'Phạm Thị Lan',
      email: 'lan@email.com',
      phone: '0987654321',
      position: 'HR Specialist',
      status: 'interview',
      appliedDate: '2024-02-03',
      experience: '3 years',
    },
    {
      id: '3',
      name: 'Trần Minh Quân',
      email: 'quan@email.com',
      phone: '0923456789',
      position: 'Senior Frontend Developer',
      status: 'offer',
      appliedDate: '2024-01-28',
      experience: '7 years',
    },
  ];

  // Mock interviews
  const interviews = [
    {
      id: '1',
      candidate: 'Phạm Thị Lan',
      position: 'HR Specialist',
      date: '2024-02-10',
      time: '14:00',
      interviewer: 'Trần Thị Bình',
      type: 'Technical',
      status: 'scheduled',
    },
    {
      id: '2',
      candidate: 'Hoàng Văn Nam',
      position: 'Senior Frontend Developer',
      date: '2024-02-12',
      time: '10:00',
      interviewer: 'Nguyễn Văn An',
      type: 'Technical',
      status: 'scheduled',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'scheduled':
        return 'bg-green-100 text-green-700';
      case 'screening':
      case 'interview':
        return 'bg-blue-100 text-blue-700';
      case 'offer':
        return 'bg-purple-100 text-purple-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Đang tuyển',
      closed: 'Đã đóng',
      screening: 'Sàng lọc',
      interview: 'Phỏng vấn',
      offer: 'Gửi offer',
      scheduled: 'Đã lên lịch',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">ATS - Tuyển dụng</h2>
          </div>
          <p className="text-gray-600">
            Applicant Tracking System - Cổng giao tiếp với bên ngoài
          </p>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Zero Trust Control: Database Isolation</p>
            <p className="text-amber-700">
              Database ứng viên (External) được tách biệt hoàn toàn với Database nhân viên chính thức (Internal) 
              để tránh tấn công leo thang (Lateral Movement).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'jobs', label: 'Tin tuyển dụng', icon: Briefcase },
            { id: 'candidates', label: 'Ứng viên', icon: Users },
            { id: 'interviews', label: 'Lịch phỏng vấn', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-pink-600 text-pink-600'
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
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tin tuyển dụng</h3>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
              + Đăng tin mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{job.title}</h4>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p>{job.department} • {job.location}</p>
                  <p>{job.type}</p>
                  <p className="text-xs text-gray-500">Đăng ngày: {job.postedDate}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">{job.applicants} ứng viên</span>
                  <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Career Portal Preview */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Career Portal (Public)</h4>
            <p className="text-sm text-gray-600 mb-3">
              Cổng nghề nghiệp công khai cho ứng viên nộp CV và xem tin tuyển dụng
            </p>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Xem Career Portal →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách ứng viên</h3>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ứng viên</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vị trí ứng tuyển</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Kinh nghiệm</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ngày nộp</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{candidate.position}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{candidate.experience}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{candidate.appliedDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                        {getStatusLabel(candidate.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                        Xem CV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Zero Trust Control: Just-in-Time Access</p>
                <p className="text-blue-700">
                  Người phỏng vấn chỉ xem được CV ứng viên trong đúng khung giờ phỏng vấn. 
                  Sau khi kết thúc, quyền truy cập tự động bị thu hồi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lịch phỏng vấn</h3>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
              + Lên lịch mới
            </button>
          </div>

          <div className="space-y-3">
            {interviews.map((interview) => (
              <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{interview.candidate}</h4>
                        <p className="text-sm text-gray-600">{interview.position}</p>
                      </div>
                    </div>
                    <div className="ml-13 space-y-1 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {interview.date} lúc {interview.time}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Người phỏng vấn: {interview.interviewer}
                      </p>
                      <p className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Vòng: {interview.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(interview.status)}`}>
                      {getStatusLabel(interview.status)}
                    </span>
                    <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                      Chi tiết →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Xem lịch đầy đủ</h4>
            <p className="text-sm text-gray-600 mb-3">
              Xem tất cả lịch phỏng vấn theo dạng lịch tháng
            </p>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Mở Calendar View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
