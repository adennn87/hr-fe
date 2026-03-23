"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Plus,
  Loader2,
  Settings,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { User } from '@/lib/auth-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/components/ui/utils';
import { getEmployeeDisplayLabel, getEmployeeSecondaryLine } from '@/lib/employee-display';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { weeklyScheduleService, type CreateWeeklyScheduleRequest, type WeeklyScheduleDay, type WeeklySchedule } from '@/services/weekly-schedule.service';
import {
  leaveRequestService,
  type LeaveRequest,
  type LeaveType,
  getLeaveRequestEmployeeLabel,
  getLeaveRequestUserId,
} from '@/services/leave-request.service';
import { employeeService, type Employee } from '@/services/employee.service';
import { getJwtRoleInfo, isAdminRoleId, isAdminUser, normalizeRoleId } from '@/lib/role-utils';
import { toast } from 'sonner';

interface TimeAttendanceProps {
  user: User;
}

type WeekScheduleRow = {
  day: string;
  date: string;
  shift: string;
  status: 'scheduled' | 'today' | 'leave';
  dayOfWeek: number;
  isLeave?: boolean;
  leaveType?: string | null;
  leaveReason?: string | null;
};

/** Chọn bản ghi lịch tuần trùng tuần hiện tại hoặc gần nhất. */
function pickCurrentWeekSchedule(schedules: WeeklySchedule[]): WeeklySchedule | null {
  if (!schedules?.length) return null;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(today.getDate() - daysToMonday);
  
  // Format YYYY-MM-DD
  const mondayStr = currentWeekMonday.toISOString().split('T')[0];

  let currentSchedule = schedules.find((s) => {
    // So sánh chuỗi YYYY-MM-DD để tránh lệch múi giờ
    const sDateStr = s.weekStartDate.includes('T') ? s.weekStartDate.split('T')[0] : s.weekStartDate;
    return sDateStr === mondayStr;
  });

  if (!currentSchedule && schedules.length > 0) {
    // Nếu không có tuần hiện tại, lấy tuần mới nhất
    const sortedSchedules = [...schedules].sort((a, b) => {
      const dateA = new Date(a.weekStartDate).getTime();
      const dateB = new Date(b.weekStartDate).getTime();
      return dateB - dateA;
    });
    currentSchedule = sortedSchedules[0];
  }
  return currentSchedule ?? null;
}

export function TimeAttendance({ user }: TimeAttendanceProps) {
  const [activeTab, setActiveTab] = useState<'leave' | 'schedule'>('leave');
  
  // Leave requests state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoadingLeave, setIsLoadingLeave] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isCreateLeaveModalOpen, setIsCreateLeaveModalOpen] = useState(false);
  const [leaveSelectedUserId, setLeaveSelectedUserId] = useState<string | 'all'>('all');
  const [leaveEmployeeFilterOpen, setLeaveEmployeeFilterOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<{
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
  }>({
    startDate: '',
    endDate: '',
    type: 'ANNUAL',
    reason: '',
  });

  // Schedule state
  const [isCreateScheduleModalOpen, setIsCreateScheduleModalOpen] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scheduleScope, setScheduleScope] = useState<'self' | 'all'>('self');
  const [scheduleBrowseAll, setScheduleBrowseAll] = useState<
    Array<{ userId: string; rows: WeekScheduleRow[]; raw: WeeklySchedule | null }>
  >([]);
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

  const [scheduleSearch, setScheduleSearch] = useState('');
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleRow[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [currentWeeklySchedule, setCurrentWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [isEditDayModalOpen, setIsEditDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<WeeklyScheduleDay | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const scheduleFetchGenRef = useRef(0);

  const isAdmin = useMemo(() => isAdminUser(userRoleId, user.role), [userRoleId, user.role]);

  useEffect(() => {
    const fetchUserRole = async () => {
      setIsLoadingRole(true);
      try {
        const jwtRole = getJwtRoleInfo();
        if (jwtRole.roleId) {
          setUserRoleId(jwtRole.roleId);
          return;
        }
        setUserRoleId(normalizeRoleId(user.role));
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoadingRole(false);
      }
    };
    fetchUserRole();
  }, [user.id, user.role]);

  const toggleExpandUser = (userId: string) => {
    setExpandedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await employeeService.getAllEmployees();
      const flattened = data.map((emp: any) => ({
        ...emp,
        fullName: emp.fullName || emp.full_name || [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() || '',
        department: emp.department && typeof emp.department === 'object' ? emp.department.name : (emp.department ?? null),
        role: emp.role && typeof emp.role === 'object' ? emp.role.name : (emp.role ?? null),
      }));
      setEmployees(flattened);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (isAdmin && (isCreateScheduleModalOpen || activeTab === 'leave' || (activeTab === 'schedule' && scheduleScope === 'all'))) {
      loadEmployees();
    }
  }, [isCreateScheduleModalOpen, isAdmin, activeTab, scheduleScope]);

  const canFilterLeaveByEmployee = useMemo(() => isAdminRoleId(userRoleId), [userRoleId]);
  const isLeaveFilterShowAll = useMemo(() => !leaveSelectedUserId || leaveSelectedUserId === 'all', [leaveSelectedUserId]);
  
  const leaveFilterEmployeeLabel = useMemo(() => {
    if (isLeaveFilterShowAll) return 'Tất cả nhân viên';
    const emp = employees.find(e => e.id === leaveSelectedUserId);
    return emp ? getEmployeeDisplayLabel(emp) : leaveSelectedUserId;
  }, [isLeaveFilterShowAll, leaveSelectedUserId, employees]);

  const displayedLeaveRequests = useMemo(() => {
    if (isAdmin) {
      if (isLeaveFilterShowAll) return leaveRequests;
      return leaveRequests.filter(r => getLeaveRequestUserId(r) === leaveSelectedUserId);
    }
    return leaveRequests.filter(r => getLeaveRequestUserId(r) === user.id);
  }, [isAdmin, isLeaveFilterShowAll, leaveSelectedUserId, leaveRequests, user.id]);

  const displayScheduleBrowseAll = useMemo(() => {
    let filtered = [...scheduleBrowseAll];
    if (scheduleSearch.trim()) {
      const s = scheduleSearch.toLowerCase().trim();
      filtered = filtered.filter(block => {
        const emp = employees.find(e => e.id === block.userId) || block.raw?.user;
        const name = getEmployeeDisplayLabel(emp).toLowerCase();
        const email = (emp?.email || '').toLowerCase();
        return name.includes(s) || email.includes(s) || block.userId.toLowerCase().includes(s);
      });
    }
    return filtered.sort((a, b) => {
      const empA = employees.find(e => e.id === a.userId) || a.raw?.user;
      const empB = employees.find(e => e.id === b.userId) || b.raw?.user;
      const nameA = empA ? getEmployeeDisplayLabel(empA) : a.userId;
      const nameB = empB ? getEmployeeDisplayLabel(empB) : b.userId;
      return String(nameA).localeCompare(String(nameB), 'vi');
    });
  }, [scheduleBrowseAll, employees, scheduleSearch]);

  const formatScheduleForDisplay = (schedule: any): WeekScheduleRow[] => {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleStartDate = new Date(schedule.weekStartDate);
    scheduleStartDate.setHours(0, 0, 0, 0);
    
    return schedule.days
      .filter((day: any) => day.isWorking || day.isLeave)
      .map((day: any) => {
        const daysToAdd = day.dayOfWeek === 7 ? 6 : day.dayOfWeek - 1;
        const dayDate = day.date ? new Date(day.date) : new Date(scheduleStartDate);
        if (!day.date) dayDate.setDate(scheduleStartDate.getDate() + daysToAdd);
        dayDate.setHours(0, 0, 0, 0);
        
        const isToday = dayDate.getTime() === today.getTime();
        const dateStr = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;
        const dayNameIndex = day.dayOfWeek === 7 ? 0 : day.dayOfWeek;
        
        let shiftStr = 'Nghỉ';
        if (day.isLeave) shiftStr = `Nghỉ phép (${day.leaveType || 'ANNUAL'})`;
        else if (day.isWorking) {
          const start = day.startTime ? day.startTime.split(':').slice(0, 2).join(':') : '';
          const end = day.endTime ? day.endTime.split(':').slice(0, 2).join(':') : '';
          shiftStr = start && end ? `${start} - ${end}` : 'Làm việc';
        }
        
        return {
          day: dayNames[dayNameIndex],
          date: dateStr,
          shift: shiftStr,
          status: (day.isLeave ? 'leave' : (isToday ? 'today' : 'scheduled')) as any,
          dayOfWeek: day.dayOfWeek,
          isLeave: day.isLeave,
          leaveType: day.leaveType,
          leaveReason: day.leaveReason
        };
      })
      .sort((a, b) => (a.dayOfWeek === 7 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 7 ? 7 : b.dayOfWeek));
  };

  const fetchWeeklyScheduleForUser = async (userId: string, requestGen?: number) => {
    const isStale = () => requestGen != null && requestGen !== scheduleFetchGenRef.current;
    setIsLoadingSchedule(true);
    try {
      const schedules = await weeklyScheduleService.getWeeklySchedules(userId);
      if (isStale()) return;
      const current = pickCurrentWeekSchedule(schedules);
      if (current) {
        setScheduleBrowseAll([]);
        setCurrentWeeklySchedule(current);
        setWeekSchedule(formatScheduleForDisplay(current));
      } else {
        setCurrentWeeklySchedule(null);
        setWeekSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setCurrentWeeklySchedule(null);
      setWeekSchedule([]);
    } finally {
      if (!isStale()) setIsLoadingSchedule(false);
    }
  };

  const fetchAllSchedulesBrowse = async (requestGen?: number) => {
    const isStale = () => requestGen != null && requestGen !== scheduleFetchGenRef.current;
    setIsLoadingSchedule(true);
    try {
      const schedules = await weeklyScheduleService.getWeeklySchedules();
      if (isStale()) return;
      if (!schedules) {
        setScheduleBrowseAll([]);
        return;
      }
      const byUser = new Map<string, WeeklySchedule[]>();
      for (const s of schedules) {
        const uid = s.userId || (s.user && typeof s.user === 'object' ? s.user.id : s.user);
        if (!uid) continue;
        if (!byUser.has(uid)) byUser.set(uid, []);
        byUser.get(uid)!.push(s);
      }
      const blocks: any[] = [];
      for (const [uid, userSchedules] of byUser) {
        const current = pickCurrentWeekSchedule(userSchedules);
        if (current) {
          blocks.push({ userId: uid, rows: formatScheduleForDisplay(current), raw: current });
        }
      }
      setWeekSchedule([]);
      setCurrentWeeklySchedule(null);
      setScheduleBrowseAll(blocks);
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      setScheduleBrowseAll([]);
    } finally {
      if (!isStale()) setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'schedule') return;
    const requestGen = ++scheduleFetchGenRef.current;
    if (isAdmin && scheduleScope === 'all') fetchAllSchedulesBrowse(requestGen);
    else fetchWeeklyScheduleForUser(viewingUserId || user.id, requestGen);
    return () => { scheduleFetchGenRef.current += 1; };
  }, [activeTab, user.id, viewingUserId, scheduleScope, isAdmin]);

  useEffect(() => {
    if (activeTab !== 'leave') return;
    const fetchLeave = async () => {
      setIsLoadingLeave(true);
      try {
        const data = isAdmin ? await leaveRequestService.getAllLeaveRequests() : await leaveRequestService.getMyLeaveRequests();
        setLeaveRequests(data || []);
      } catch (error) {
        console.error('Error fetching leave:', error);
      } finally {
        setIsLoadingLeave(false);
      }
    };
    fetchLeave();
  }, [activeTab, isAdmin]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLeave(true);
    try {
      await leaveRequestService.createLeaveRequest(leaveForm);
      toast.success('Gửi đơn thành công');
      setIsCreateLeaveModalOpen(false);
      const data = isAdmin ? await leaveRequestService.getAllLeaveRequests() : await leaveRequestService.getMyLeaveRequests();
      setLeaveRequests(data || []);
    } catch (error) {
      toast.error('Lỗi khi gửi đơn');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleOpenCreateScheduleModal = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
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
    setScheduleForm(p => ({
      ...p,
      days: p.days.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)
    }));
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!scheduleForm.userId) throw new Error('Chọn nhân viên');
      await weeklyScheduleService.createWeeklySchedule({
        ...scheduleForm,
        days: scheduleForm.days.map(d => d.isWorking ? { ...d } : { dayOfWeek: d.dayOfWeek, isWorking: false })
      });
      toast.success('Tạo lịch thành công');
      setIsCreateScheduleModalOpen(false);
      if (isAdmin && scheduleScope === 'all') fetchAllSchedulesBrowse();
      else fetchWeeklyScheduleForUser(viewingUserId || user.id);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tạo lịch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản lý ca làm & Nghỉ phép</h2>
            <p className="text-sm text-gray-500">Xem và sắp xếp lịch làm việc hàng tuần</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: 'leave', label: 'Quản lý nghỉ phép', icon: Calendar },
            { id: 'schedule', label: 'Lịch làm việc', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 pb-3 border-b-2 transition-colors font-medium",
                activeTab === tab.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Đơn xin nghỉ</h3>
            <Button onClick={() => setIsCreateLeaveModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Tạo đơn mới
            </Button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Label className="text-sm font-medium text-gray-600 shrink-0">Lọc nhân viên:</Label>
              <Select value={leaveSelectedUserId} onValueChange={setLeaveSelectedUserId}>
                <SelectTrigger className="w-64 bg-white"><SelectValue placeholder="Tất cả nhân viên" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{getEmployeeDisplayLabel(e)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingLeave ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : displayedLeaveRequests.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {displayedLeaveRequests.map(req => (
                <div key={req.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      {isAdmin && <p className="text-sm font-bold text-blue-700 mb-1">{getLeaveRequestEmployeeLabel(req)}</p>}
                      <div className="flex items-center gap-2 mb-2">
                         <span className="font-bold text-gray-900">{req.type}</span>
                         <span className={cn(
                           "px-2 py-0.5 text-[10px] font-black uppercase rounded",
                           req.status === 'APPROVED' ? "bg-green-100 text-green-700" : req.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                         )}>{req.status}</span>
                      </div>
                      <p className="text-sm text-gray-600">{req.startDate} → {req.endDate}</p>
                      <p className="text-sm text-gray-500 mt-1 italic">"{req.reason}"</p>
                    </div>
                    {isAdmin && req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => leaveRequestService.updateLeaveStatus(req.id, 'APPROVED').then(() => loadEmployees())}>Duyệt</Button>
                        <Button size="sm" variant="outline" className="text-red-600">Từ chối</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-400">Không có đơn nghỉ phép</div>}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
             <h3 className="text-lg font-bold text-gray-900">Lịch tuần này</h3>
             <div className="flex items-center gap-3">
               {isAdmin && scheduleScope === 'all' && (
                 <div className="relative w-64">
                   <Input placeholder="Tìm nhân viên..." value={scheduleSearch} onChange={e => setScheduleSearch(e.target.value)} className="pl-9 h-9" />
                   <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 </div>
               )}
               {isAdmin && (
                 <Select value={scheduleScope} onValueChange={v => setScheduleScope(v as any)}>
                   <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="self">Lịch của tôi</SelectItem>
                     <SelectItem value="all">Tất cả NV</SelectItem>
                   </SelectContent>
                 </Select>
               )}
               {isAdmin && (
                 <Button onClick={handleOpenCreateScheduleModal} size="sm" className="bg-purple-600 hover:bg-purple-700 h-9">
                   <Plus className="w-4 h-4 mr-2" /> Tạo lịch
                 </Button>
               )}
             </div>
          </div>

          {isLoadingSchedule ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
          ) : isAdmin && scheduleScope === 'all' ? (
            <div className="space-y-3">
              {displayScheduleBrowseAll.map(block => {
                const emp = employees.find(e => e.id === block.userId) || block.raw?.user;
                const label = emp ? getEmployeeDisplayLabel(emp) : block.userId;
                const expanded = expandedUserIds.has(block.userId);
                return (
                  <div key={block.userId} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => toggleExpandUser(block.userId)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">{label.slice(0,1)}</div>
                         <div className="text-left">
                           <h4 className="font-bold text-gray-900">{label}</h4>
                           <p className="text-xs text-gray-500">{emp?.position || 'Nhân viên'} • {block.rows.length} ca</p>
                         </div>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                      <div className="p-4 pt-0 border-t border-gray-50 bg-gray-50/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                          {block.rows.map((row, i) => (
                            <div key={i} className={cn("p-3 rounded-lg border", row.status === 'today' ? "bg-orange-50 border-orange-200" : row.status === 'leave' ? "bg-red-50 border-red-100" : "bg-white border-gray-100")}>
                               <p className="text-[10px] font-black uppercase text-gray-400">{row.day} {row.date}</p>
                               <p className={cn("text-sm font-bold mt-1", row.status === 'leave' ? "text-red-700" : "text-gray-900")}>{row.shift}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : weekSchedule.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekSchedule.map((row, i) => (
                <div key={i} className={cn("p-4 rounded-xl border shadow-sm", row.status === 'today' ? "bg-orange-50/50 border-orange-200 ring-1 ring-orange-100" : row.status === 'leave' ? "bg-red-50/50 border-red-100" : "bg-white border-gray-100")}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", row.status === 'today' ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-500")}>{row.day}</span>
                    <span className="text-xs font-bold text-gray-400">{row.date}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={cn("text-lg font-bold leading-tight", row.status === 'leave' ? "text-red-700" : "text-gray-900")}>{row.shift}</p>
                      {row.status === 'today' && !row.isLeave && <p className="text-[10px] text-orange-600 font-bold mt-1">Hôm nay</p>}
                    </div>
                    {isAdmin && scheduleScope === 'self' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400"><Settings className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => {
                             const day = currentWeeklySchedule?.days.find(d => d.dayOfWeek === row.dayOfWeek);
                             if (day) { setEditingDay({...day}); setIsEditDayModalOpen(true); }
                           }}><Pencil className="w-4 h-4 mr-2" /> Sửa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-400">Không có lịch làm việc tuần này</div>}
        </div>
      )}

      {/* Modals */}
      <Dialog open={isCreateScheduleModalOpen} onOpenChange={setIsCreateScheduleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Tạo lịch làm việc</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitSchedule} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Nhân viên</Label>
                 <Select value={scheduleForm.userId} onValueChange={v => setScheduleForm(p => ({...p, userId: v}))}>
                   <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                   <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{getEmployeeDisplayLabel(e)}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-2"><Label>Từ ngày</Label><Input type="date" value={scheduleForm.weekStartDate} onChange={e => setScheduleForm(p => ({...p, weekStartDate: e.target.value}))} /></div>
                 <div className="space-y-2"><Label>Đến ngày</Label><Input type="date" value={scheduleForm.weekEndDate} onChange={e => setScheduleForm(p => ({...p, weekEndDate: e.target.value}))} /></div>
               </div>
            </div>
            <div className="space-y-3">
              <Label className="font-bold">Lịch trình chi tiết</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                {scheduleForm.days.map(day => (
                  <div key={day.dayOfWeek} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3 w-32">
                      <Checkbox checked={day.isWorking} onCheckedChange={v => handleUpdateDay(day.dayOfWeek, 'isWorking', !!v)} />
                      <span className="text-sm font-bold">{dayNames[day.dayOfWeek === 7 ? 0 : day.dayOfWeek]}</span>
                    </div>
                    {day.isWorking && (
                      <div className="flex items-center gap-2">
                        <Input type="time" value={day.startTime || ''} onChange={e => handleUpdateDay(day.dayOfWeek, 'startTime', e.target.value)} className="w-24 h-8 text-xs" />
                        <span className="text-gray-400">→</span>
                        <Input type="time" value={day.endTime || ''} onChange={e => handleUpdateDay(day.dayOfWeek, 'endTime', e.target.value)} className="w-24 h-8 text-xs" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateScheduleModalOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600"> {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo lịch'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDayModalOpen} onOpenChange={setIsEditDayModalOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader><DialogTitle>Sửa ca làm việc</DialogTitle></DialogHeader>
           {editingDay && (
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (!currentWeeklySchedule) return;
               try {
                 await weeklyScheduleService.updateWeeklyScheduleDays(currentWeeklySchedule.id, [editingDay]);
                 toast.success('Cập nhật thành công');
                 setIsEditDayModalOpen(false);
                 fetchWeeklyScheduleForUser(viewingUserId || user.id);
               } catch (err) { toast.error('Thất bại'); }
             }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{dayNames[editingDay.dayOfWeek === 7 ? 0 : editingDay.dayOfWeek]}</span>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={editingDay.isWorking} onCheckedChange={v => setEditingDay(p => p ? {...p, isWorking: !!v} : p)} />
                    <Label className="text-sm">Làm việc</Label>
                  </div>
                </div>
                {editingDay.isWorking && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Giờ vào</Label><Input type="time" value={editingDay.startTime || ''} onChange={e => setEditingDay(p => p ? {...p, startTime: e.target.value} : p)} /></div>
                    <div className="space-y-1"><Label>Giờ ra</Label><Input type="time" value={editingDay.endTime || ''} onChange={e => setEditingDay(p => p ? {...p, endTime: e.target.value} : p)} /></div>
                  </div>
                )}
                <DialogFooter>
                   <Button type="button" variant="ghost" onClick={() => setIsEditDayModalOpen(false)}>Hủy</Button>
                   <Button type="submit" className="bg-purple-600">Lưu</Button>
                </DialogFooter>
             </form>
           )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateLeaveModalOpen} onOpenChange={setIsCreateLeaveModalOpen}>
        <DialogContent className="max-w-md">
           <DialogHeader><DialogTitle>Tạo đơn xin nghỉ</DialogTitle></DialogHeader>
           <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Từ ngày</Label><Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({...p, startDate: e.target.value}))} required /></div>
                <div className="space-y-1"><Label>Đến ngày</Label><Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({...p, endDate: e.target.value}))} required /></div>
              </div>
              <div className="space-y-1">
                <Label>Loại nghỉ</Label>
                <Select value={leaveForm.type} onValueChange={v => setLeaveForm(p => ({...p, type: v as any}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Nghỉ phép năm</SelectItem>
                    <SelectItem value="SICK">Nghỉ ốm</SelectItem>
                    <SelectItem value="UNPAID">Nghỉ không lương</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Lý do</Label><Input placeholder="Lý do nghỉ..." value={leaveForm.reason} onChange={e => setLeaveForm(p => ({...p, reason: e.target.value}))} required /></div>
              <DialogFooter>
                 <Button type="button" variant="ghost" onClick={() => setIsCreateLeaveModalOpen(false)}>Hủy</Button>
                 <Button type="submit" disabled={isSubmittingLeave} className="bg-blue-600">Gửi đơn</Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
