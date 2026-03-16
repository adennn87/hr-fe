"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, MapPin, AlertCircle, CheckCircle, UserCheck, Plus, Loader2 } from 'lucide-react';
import { User } from '@/lib/auth-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { weeklyScheduleService, type CreateWeeklyScheduleRequest, type WeeklyScheduleDay } from '@/services/weekly-schedule.service';
import { employeeService, type Employee } from '@/services/employee.service';
import { toast } from 'sonner';

interface TimeAttendanceProps {
  user: User;
}

export function TimeAttendance({ user }: TimeAttendanceProps) {
  const [activeTab, setActiveTab] = useState< 'leave' | 'schedule'>('leave');
  const [checkInStatus, setCheckInStatus] = useState<'not_checked' | 'checking' | 'success' | 'blocked'>('not_checked');
  
  // State cho modal tạo lịch làm việc
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scheduleForm, setScheduleForm] = useState<CreateWeeklyScheduleRequest>({
    userId: '',
    weekStartDate: '',
    weekEndDate: '',
    days: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 6, isWorking: false },
      { dayOfWeek: 7, isWorking: false },
    ],
  });

  // State để lưu role name từ API hoặc token
  const [userRoleName, setUserRoleName] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Lấy role name từ JWT token hoặc API
  useEffect(() => {
    const fetchUserRole = async () => {
      setIsLoadingRole(true);
      try {
        // Ưu tiên 1: Lấy từ JWT token
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role) {
              // Role trong token có thể là object với name hoặc string
              if (typeof payload.role === 'object' && payload.role !== null && payload.role.name) {
                setUserRoleName(payload.role.name);
                setIsLoadingRole(false);
                return;
              }
              if (typeof payload.role === 'string') {
                setUserRoleName(payload.role);
                setIsLoadingRole(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Error decoding JWT token:', e);
          }
        }

        // Ưu tiên 2: Nếu user.role là UUID, gọi API để lấy role name
        if (user.id && user.role) {
          try {
            const employee = await employeeService.getEmployeeById(user.id);
            if (employee.role) {
              const roleName = typeof employee.role === 'object' ? employee.role.name : employee.role;
              if (roleName) {
                setUserRoleName(roleName);
                setIsLoadingRole(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Error fetching user role from API:', e);
          }
        }

        // Fallback: Dùng user.role trực tiếp nếu là string
        if (typeof user.role === 'string' && user.role) {
          setUserRoleName(user.role);
        } else if (typeof user.role === 'object' && user.role !== null && (user.role as any).name) {
          setUserRoleName((user.role as any).name);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user.id, user.role]);

  // Check nếu user là admin - chỉ check role name === "admin"
  const isAdmin = useMemo(() => {
    if (!userRoleName) return false;
    return userRoleName.toLowerCase() === 'admin';
  }, [userRoleName]);
  
  // Debug log để kiểm tra role
  useEffect(() => {
    console.log('TimeAttendance - User role check:', {
      rawRole: user.role,
      userRoleName,
      isAdmin,
      userObject: user
    });
  }, [user.role, userRoleName, isAdmin, user]);

  // Load danh sách employees khi mở modal
  useEffect(() => {
    if (isCreateScheduleModalOpen && isAdmin) {
      loadEmployees();
    }
  }, [isCreateScheduleModalOpen, isAdmin]);

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await employeeService.getAllEmployees();
      // Flatten department và role objects
      const flattened = data.map((emp: any) => ({
        ...emp,
        department: typeof emp.department === 'object' ? emp.department.name : emp.department,
        role: typeof emp.role === 'object' ? emp.role.name : emp.role,
      }));
      setEmployees(flattened);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      toast.error('Không thể tải danh sách nhân viên', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleOpenCreateScheduleModal = () => {
    // Reset form
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Get Sunday

    setScheduleForm({
      userId: '',
      weekStartDate: monday.toISOString().split('T')[0],
      weekEndDate: sunday.toISOString().split('T')[0],
      days: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isWorking: true },
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isWorking: true },
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isWorking: true },
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isWorking: true },
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isWorking: true },
        { dayOfWeek: 6, isWorking: false },
        { dayOfWeek: 7, isWorking: false },
      ],
    });
    setIsCreateScheduleModalOpen(true);
  };

  const handleUpdateDay = (dayOfWeek: number, field: keyof WeeklyScheduleDay, value: any) => {
    setScheduleForm(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, [field]: value }
          : day
      ),
    }));
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduleForm.userId) {
      toast.error('Vui lòng chọn nhân viên');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate form data trước khi gửi
      if (!scheduleForm.userId) {
        toast.error('Vui lòng chọn nhân viên');
        setIsSubmitting(false);
        return;
      }
      
      if (!scheduleForm.weekStartDate || !scheduleForm.weekEndDate) {
        toast.error('Vui lòng chọn tuần làm việc');
        setIsSubmitting(false);
        return;
      }
      
      // Validate: Kiểm tra có ít nhất 1 ngày làm việc (cho phép chỉ 1 ngày)
      const workingDays = scheduleForm.days.filter(day => day.isWorking);
      if (workingDays.length === 0) {
        toast.error('Vui lòng chọn ít nhất một ngày làm việc');
        setIsSubmitting(false);
        return;
      }
      
      // Validate: Kiểm tra các ngày làm việc có startTime và endTime
      const invalidDays = workingDays.filter(day => 
        !day.startTime || !day.endTime
      );
      if (invalidDays.length > 0) {
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const missingDays = invalidDays.map(d => {
          const dayIndex = d.dayOfWeek === 7 ? 0 : d.dayOfWeek;
          return dayNames[dayIndex];
        }).join(', ');
        toast.error(`Vui lòng nhập đầy đủ giờ vào và giờ ra cho ${missingDays}`);
        setIsSubmitting(false);
        return;
      }
      
      // Validate: Kiểm tra startTime < endTime
      const invalidTimeRange = workingDays.filter(day => {
        if (!day.startTime || !day.endTime) return false;
        const start = day.startTime.split(':').map(Number);
        const end = day.endTime.split(':').map(Number);
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        return startMinutes >= endMinutes;
      });
      if (invalidTimeRange.length > 0) {
        toast.error('Giờ vào phải nhỏ hơn giờ ra');
        setIsSubmitting(false);
        return;
      }
      
      // Đảm bảo format dữ liệu đúng và có đầy đủ 7 ngày (1-7)
      // Tạo array với đầy đủ 7 ngày từ đầu
      const cleanedDays: Array<{
        dayOfWeek: number;
        startTime?: string;
        endTime?: string;
        isWorking: boolean;
      }> = [];
      
      // Tạo map từ form data để dễ lookup
      const formDaysMap = new Map(scheduleForm.days.map(day => [day.dayOfWeek, day]));
      
      // Tạo đầy đủ 7 ngày (1 = Monday, 2 = Tuesday, ..., 7 = Sunday)
      for (let i = 1; i <= 7; i++) {
        const formDay = formDaysMap.get(i);
        if (formDay && formDay.isWorking && formDay.startTime && formDay.endTime) {
          // Ngày làm việc: phải có startTime và endTime
          cleanedDays.push({
            dayOfWeek: i,
            startTime: formDay.startTime,
            endTime: formDay.endTime,
            isWorking: true,
          });
        } else {
          // Ngày không làm việc: chỉ có dayOfWeek và isWorking (KHÔNG có startTime và endTime)
          cleanedDays.push({
            dayOfWeek: i,
            isWorking: false,
          });
        }
      }
      
      // Log để debug
      console.log('Cleaned Days:', cleanedDays);
      console.log('Working days count:', cleanedDays.filter(d => d.isWorking).length);
      
      const cleanedForm = {
        userId: scheduleForm.userId.trim(),
        weekStartDate: scheduleForm.weekStartDate,
        weekEndDate: scheduleForm.weekEndDate,
        days: cleanedDays,
      };
      
      // Log data trước khi gửi để debug
      console.log('=== Submitting Schedule Form ===');
      console.log('Cleaned Form:', JSON.stringify(cleanedForm, null, 2));
      console.log('===============================');
      
      const createdSchedule = await weeklyScheduleService.createWeeklySchedule(cleanedForm);
      toast.success('Tạo lịch làm việc thành công');
      setIsCreateScheduleModalOpen(false);
      
      // Refresh lại danh sách lịch làm việc
      // Nếu admin tạo cho user khác, hiển thị lịch của user đó
      // Nếu user thường hoặc admin tạo cho chính mình, hiển thị lịch của user hiện tại
      try {
        if (isAdmin && cleanedForm.userId !== user.id) {
          // Admin tạo cho user khác, set viewingUserId để hiển thị lịch của user đó
          // useEffect sẽ tự động fetch khi viewingUserId thay đổi
          setViewingUserId(cleanedForm.userId);
        } else {
          // User thường hoặc admin tạo cho chính mình, refresh lịch của user hiện tại
          setViewingUserId(null);
          // Gọi trực tiếp để refresh ngay lập tức
          await fetchWeeklyScheduleForUser(user.id);
        }
      } catch (refreshError) {
        // Nếu refresh lỗi, không hiển thị error vì đã tạo thành công
        console.warn('Failed to refresh schedule after creation:', refreshError);
      }
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      
      // Nếu lỗi về token hết hạn, không hiển thị toast vì đã redirect
      if (error.message && error.message.includes('Phiên làm việc hết hạn')) {
        toast.error('Phiên làm việc hết hạn', {
          description: 'Vui lòng đăng nhập lại',
        });
        return;
      }
      
      // Hiển thị error message chi tiết
      const errorMessage = error.message || 'Không thể tạo lịch làm việc';
      toast.error('Không thể tạo lịch làm việc', {
        description: errorMessage.includes('Error 500') || errorMessage.includes('Internal server error')
          ? 'Lỗi server. Vui lòng kiểm tra lại dữ liệu và thử lại. Xem Console để biết chi tiết.' 
          : errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];



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

  // State cho lịch làm việc từ API
  const [weekSchedule, setWeekSchedule] = useState<Array<{
    day: string;
    date: string;
    shift: string;
    status: 'scheduled' | 'today';
  }>>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  // State để lưu userId đang xem lịch (cho admin có thể xem lịch của user khác)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // Fetch lịch làm việc từ API
  useEffect(() => {
    if (activeTab === 'schedule') {
      const targetUserId = viewingUserId || user.id;
      if (targetUserId) {
        fetchWeeklyScheduleForUser(targetUserId);
      }
    }
  }, [activeTab, user.id, viewingUserId]);

  const fetchWeeklyScheduleForUser = async (userId: string) => {
    setIsLoadingSchedule(true);
    try {
      // Lấy lịch làm việc của user
      const schedules = await weeklyScheduleService.getWeeklySchedules(userId);
      
      if (schedules && schedules.length > 0) {
        // Lấy schedule của tuần hiện tại hoặc gần nhất
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentWeekStart = new Date(today);
        // Tính Monday của tuần hiện tại (0 = Sunday, 1 = Monday, ...)
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Nếu là Sunday (0), cần lùi 6 ngày
        currentWeekStart.setDate(today.getDate() - daysToMonday);
        currentWeekStart.setHours(0, 0, 0, 0);
        
        // Tìm schedule phù hợp với tuần hiện tại (so sánh ngày, không so sánh giờ)
        let currentSchedule = schedules.find(s => {
          const scheduleStart = new Date(s.weekStartDate);
          scheduleStart.setHours(0, 0, 0, 0);
          return scheduleStart.getTime() === currentWeekStart.getTime();
        });
        
        // Nếu không tìm thấy, lấy schedule gần nhất (sắp xếp theo weekStartDate giảm dần)
        if (!currentSchedule && schedules.length > 0) {
          const sortedSchedules = [...schedules].sort((a, b) => {
            const dateA = new Date(a.weekStartDate).getTime();
            const dateB = new Date(b.weekStartDate).getTime();
            return dateB - dateA; // Mới nhất trước
          });
          currentSchedule = sortedSchedules[0];
        }
        
        if (currentSchedule) {
          // Format schedule để hiển thị
          const formattedSchedule = formatScheduleForDisplay(currentSchedule);
          setWeekSchedule(formattedSchedule);
        } else {
          setWeekSchedule([]);
        }
      } else {
        setWeekSchedule([]);
      }
    } catch (error: any) {
      console.error('Error fetching weekly schedule:', error);
      // Nếu lỗi, hiển thị empty state
      setWeekSchedule([]);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Format schedule từ API sang format hiển thị
  const formatScheduleForDisplay = (schedule: any) => {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time để so sánh ngày
    
    const scheduleStartDate = new Date(schedule.weekStartDate);
    scheduleStartDate.setHours(0, 0, 0, 0);
    
    return schedule.days
      .filter((day: any) => day.isWorking) // Chỉ hiển thị ngày làm việc
      .map((day: any) => {
        // dayOfWeek trong API: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
        // Tính số ngày cần cộng vào weekStartDate
        // dayOfWeek 1 (Monday) = +0 days, 2 (Tuesday) = +1 day, ..., 7 (Sunday) = +6 days
        const daysToAdd = day.dayOfWeek === 7 ? 6 : day.dayOfWeek - 1;
        
        const dayDate = new Date(scheduleStartDate);
        dayDate.setDate(scheduleStartDate.getDate() + daysToAdd);
        
        const isToday = dayDate.getTime() === today.getTime();
        
        // Format date: DD/MM
        const dateStr = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;
        
        // dayOfWeek index cho dayNames array: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const dayNameIndex = day.dayOfWeek === 7 ? 0 : day.dayOfWeek;
        
        const shiftStr = day.startTime && day.endTime 
          ? `Sáng (${day.startTime} - ${day.endTime})`
          : 'Làm việc';
        
        return {
          day: dayNames[dayNameIndex],
          date: dateStr,
          shift: shiftStr,
          status: isToday ? 'today' as const : 'scheduled' as const,
        };
      })
      .sort((a, b) => {
        // Sort theo thứ tự trong tuần
        const dayOrder = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });
  };

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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lịch làm việc tuần này</h3>
            {isLoadingRole ? (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang kiểm tra quyền...
              </div>
            ) : isAdmin ? (
              <Button onClick={handleOpenCreateScheduleModal} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Tạo lịch làm việc
              </Button>
            ) : null}
          </div>

          {isLoadingSchedule ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Đang tải lịch làm việc...</span>
            </div>
          ) : weekSchedule.length > 0 ? (
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
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Chưa có lịch làm việc</p>
              <p className="text-sm text-gray-500 mt-1">Lịch làm việc của bạn sẽ được hiển thị ở đây</p>
            </div>
          )}
        </div>
      )}

      {/* Modal tạo lịch làm việc */}
      <Dialog open={isCreateScheduleModalOpen} onOpenChange={setIsCreateScheduleModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo lịch làm việc</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitSchedule} className="space-y-6">
            {/* Chọn nhân viên */}
            <div className="space-y-2">
              <Label htmlFor="userId">Nhân viên *</Label>
              {isLoadingEmployees ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải danh sách nhân viên...
                </div>
              ) : (
                <Select
                  value={scheduleForm.userId}
                  onValueChange={(value) => setScheduleForm(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tuần làm việc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekStartDate">Ngày bắt đầu tuần *</Label>
                <Input
                  id="weekStartDate"
                  type="date"
                  value={scheduleForm.weekStartDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, weekStartDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekEndDate">Ngày kết thúc tuần *</Label>
                <Input
                  id="weekEndDate"
                  type="date"
                  value={scheduleForm.weekEndDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, weekEndDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Lịch làm việc theo ngày */}
            <div className="space-y-4">
              <Label>Lịch làm việc theo ngày</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {scheduleForm.days.map((day) => (
                  <div key={day.dayOfWeek} className="flex items-center gap-4">
                    <div className="w-24">
                      <Label className="font-medium">{dayNames[day.dayOfWeek === 7 ? 0 : day.dayOfWeek]}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={day.isWorking}
                        onCheckedChange={(checked) =>
                          handleUpdateDay(day.dayOfWeek, 'isWorking', checked)
                        }
                      />
                      <Label className="text-sm">Làm việc</Label>
                    </div>
                    {day.isWorking && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm w-16">Giờ vào:</Label>
                          <Input
                            type="time"
                            value={day.startTime || ''}
                            onChange={(e) =>
                              handleUpdateDay(day.dayOfWeek, 'startTime', e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm w-16">Giờ ra:</Label>
                          <Input
                            type="time"
                            value={day.endTime || ''}
                            onChange={(e) =>
                              handleUpdateDay(day.dayOfWeek, 'endTime', e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateScheduleModalOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo lịch làm việc'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
