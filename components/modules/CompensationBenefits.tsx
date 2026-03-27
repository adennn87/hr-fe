"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, FileText, Heart, Shield, Lock, AlertTriangle, Settings, ChevronDown, Check, Loader2, Download, Eye } from 'lucide-react';
import { User } from '@/lib/auth-types';
import { employeeService, type Employee } from '@/services/employee.service';
import { payrollService, type PayrollDetail, type PayrollMonthRow } from '@/services/payroll.service';
import { getJwtRoleInfo, isAdminRoleId, normalizeRoleId } from '@/lib/role-utils';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/use-permissions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/components/ui/utils';
import { getEmployeeDisplayLabel, getEmployeeSecondaryLine } from '@/lib/employee-display';

interface CompensationBenefitsProps {
  user: User;
}

export function CompensationBenefits({ user }: CompensationBenefitsProps) {
  const [activeTab, setActiveTab] = useState<'salary' | 'payslip' | 'benefits'>('salary');
  const [requireStepUp, setRequireStepUp] = useState(false);
  const [stepUpVerified, setStepUpVerified] = useState(false);
  const [userRoleId, setUserRoleId] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);

  // Admin UI: chọn nhân viên (tìm theo ID / tên / email) để xem lương
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('me');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [monthRows, setMonthRows] = useState<PayrollMonthRow[]>([]);
  const [isLoadingMonthRows, setIsLoadingMonthRows] = useState(false);
  const { hasPermission } = usePermissions();
  const [payrollEmployeeSelectOpen, setPayrollEmployeeSelectOpen] = useState(false);

  // Payslip tab state
  const [payslipMonth, setPayslipMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [isPdfLoading, setIsPdfLoading] = useState<'view' | 'download' | null>(null);

  // Admin "Xuất lương" tab state
  const [exportMonth, setExportMonth] = useState<string>(() => String(new Date().getMonth() + 1));
  const [rowPdfLoading, setRowPdfLoading] = useState<Record<string, 'view' | 'download'>>({});

  const setRowLoading = (userId: string, action: 'view' | 'download' | null) => {
    setRowPdfLoading((prev) => {
      if (action === null) {
        const next = { ...prev };
        delete next[userId];
        return next;
      }
      return { ...prev, [userId]: action };
    });
  };

  const triggerPdfBlob = async (userId: string, month: string, filename: string, mode: 'view' | 'download') => {
    const blob = await payrollService.downloadPayrollPdf(userId, month);
    const objectUrl = URL.createObjectURL(blob);
    if (mode === 'view') {
      window.open(objectUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } else {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success('Đã tải phiếu lương thành công');
    }
  };

  const handleViewPayslipPdf = async () => {
    const targetUserId = user.id;
    if (!targetUserId) return;
    setIsPdfLoading('view');
    try {
      await triggerPdfBlob(targetUserId, payslipMonth, '', 'view');
    } catch (error: any) {
      toast.error('Không thể xem phiếu lương', { description: error.message || 'Vui lòng thử lại sau' });
    } finally {
      setIsPdfLoading(null);
    }
  };

  const handleDownloadPayslipPdf = async () => {
    const targetUserId = user.id;
    if (!targetUserId) return;
    setIsPdfLoading('download');
    try {
      const empName = (user as any).name || user.email || targetUserId;
      await triggerPdfBlob(targetUserId, payslipMonth, `phieu-luong-thang${payslipMonth}-${empName}.pdf`, 'download');
    } catch (error: any) {
      toast.error('Không thể tải phiếu lương', { description: error.message || 'Vui lòng thử lại sau' });
    } finally {
      setIsPdfLoading(null);
    }
  };

  const handleRowViewPdf = async (emp: Employee) => {
    setRowLoading(emp.id, 'view');
    try {
      await triggerPdfBlob(emp.id, exportMonth, '', 'view');
    } catch (error: any) {
      toast.error(`Không thể xem phiếu lương của ${emp.fullName || emp.email}`, { description: error.message });
    } finally {
      setRowLoading(emp.id, null);
    }
  };

  const handleRowDownloadPdf = async (emp: Employee) => {
    setRowLoading(emp.id, 'download');
    try {
      const name = emp.fullName || emp.email || emp.id;
      await triggerPdfBlob(emp.id, exportMonth, `phieu-luong-thang${exportMonth}-${name}.pdf`, 'download');
    } catch (error: any) {
      toast.error(`Không thể tải phiếu lương của ${emp.fullName || emp.email}`, { description: error.message });
    } finally {
      setRowLoading(emp.id, null);
    }
  };
  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === 'me') return null;
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const payrollEmployeeSelectLabel = useMemo(() => {
    if (selectedEmployeeId === 'me') return 'Tài khoản của tôi';
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return selectedEmployeeId;
    const label = getEmployeeDisplayLabel(emp);
    const sub = getEmployeeSecondaryLine(emp);
    return sub ? `${label} (${sub})` : label;
  }, [selectedEmployeeId, employees]);

  // Lấy role id từ JWT token hoặc user.role
  useEffect(() => {
    const fetchUserRole = async () => {
      setIsLoadingRole(true);
      try {
        const jwtRole = getJwtRoleInfo();
        if (jwtRole.roleId) {
          setUserRoleId(jwtRole.roleId);
          return;
        }

        // Fallback: user.role có thể đã là roleId UUID
        setUserRoleId(normalizeRoleId(user.role));
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setIsLoadingRole(false);
      }
    };
    fetchUserRole();
  }, [user.role]);

  // Check admin theo roleId or roleName
  const isAdmin = useMemo(() => {
    return isAdminRoleId(userRoleId) || (user?.role && typeof user.role === 'string' && ['admin', 'system admin', 'hr manager'].includes(user.role.toLowerCase()));
  }, [userRoleId, user.role]);

  // Load employees cho dropdown khi admin vào tab salary
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'salary') return;

    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const data = await employeeService.getAllEmployees();
        const flattened = (data || []).map((emp: any) => ({
          ...emp,
          fullName:
            emp.fullName ||
            emp.full_name ||
            [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() ||
            '',
          department:
            emp.department && typeof emp.department === 'object'
              ? emp.department.name
              : emp.department ?? null,
          role:
            emp.role && typeof emp.role === 'object' ? emp.role.name : emp.role ?? null,
        }));
        setEmployees(flattened);
      } catch (error: any) {
        console.error('Error loading employees for payroll filter:', error);
        toast.error('Không thể tải danh sách nhân viên', {
          description: error.message || 'Vui lòng thử lại sau',
        });
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [isAdmin, activeTab]);

  // Load payroll theo userId + month
  useEffect(() => {
    if (activeTab !== 'salary') return;

    const targetUserId = selectedEmployeeId === 'me' ? user.id : selectedEmployeeId;
    if (!targetUserId) return;

    const loadPayroll = async () => {
      setIsLoadingPayroll(true);
      try {
        const data = await payrollService.getPayrollByUserId(targetUserId, selectedMonth);
        setPayroll(data);
      } catch (error: any) {
        console.error('Error fetching payroll:', error);
        toast.error('Không thể tải dữ liệu lương', {
          description: error.message || 'Vui lòng thử lại sau',
        });
        setPayroll(null);
      } finally {
        setIsLoadingPayroll(false);
      }
    };

    // Non-admin: chỉ cho xem lương của chính mình
    if (!isAdmin && selectedEmployeeId !== 'me') {
      setSelectedEmployeeId('me');
      return;
    }

    loadPayroll();
  }, [activeTab, selectedEmployeeId, selectedMonth, user.id, isAdmin]);

  // Admin: load bảng lương tháng để hiển thị dropdown "Tên - username - thực nhận"
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'salary') return;

    const loadMonthRows = async () => {
      setIsLoadingMonthRows(true);
      try {
        const rows = await payrollService.getPayrollByMonth(selectedMonth);
        setMonthRows(rows || []);
      } catch (error: any) {
        console.error('Error fetching payroll month rows:', error);
        // Không toast liên tục, chỉ log; UI sẽ fallback sang dropdown select nhân viên nếu cần
        setMonthRows([]);
      } finally {
        setIsLoadingMonthRows(false);
      }
    };

    loadMonthRows();
  }, [isAdmin, activeTab, selectedMonth]);

  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculatePayroll = async () => {
    setIsCalculating(true);
    try {
      await payrollService.calculatePayroll(selectedMonth);
      toast.success(`Đã yêu cầu tính toán bảng lương tháng ${selectedMonth}`, {
        description: 'Dữ liệu đang được khởi tạo, vui lòng đợi trong giây lát.'
      });
      // Refetch sau khi generate
      setTimeout(async () => {
        try {
          const rows = await payrollService.getPayrollByMonth(selectedMonth);
          setMonthRows(rows || []);
          const targetUserId = selectedEmployeeId === 'me' ? user.id : selectedEmployeeId;
          if (targetUserId) {
            const data = await payrollService.getPayrollByUserId(targetUserId, selectedMonth);
            setPayroll(data);
          }
        } catch {
          // Ignore refetch errors silently
        }
      }, 2000);
    } catch (error: any) {
      toast.error('Lỗi khi tính lương', {
        description: error.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const isPayrollDataMissing = useMemo(() => {
    if (isAdmin && monthRows.length > 0) {
      // Check if any row has null values (based on user request)
      return monthRows.some((row: any) => row.workingDays === null || row.baseSalary === null);
    }
    if (payroll) {
        return payroll.workingDays === null || payroll.baseSalary === null;
    }
    return false;
  }, [isAdmin, monthRows, payroll]);

  const salaryData = useMemo(() => {
    // Nếu đã có payroll từ API thì dùng, không thì fallback mock
    if (payroll && payroll.workingDays !== null) {
      const adjustments = payroll.adjustments || [];
      const add = adjustments
        .filter((a) => (a.category || a.type) === 'ADD')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const sub = adjustments
        .filter((a) => (a.category || a.type) === 'SUB')
        .reduce((sum, a) => sum + Number(a.amount || 0), 0);

      const base = Number(payroll.baseSalary || 0);
      const allowance = Number(payroll.allowance || 0);
      const ins = Number(payroll.insurance ?? 0);
      const taxAmt = Number(payroll.tax ?? 0);
      const deduction = Number(payroll.deduction || 0) + sub;
      const gross = base + allowance + add;
      const net = Number(payroll.finalSalary || 0);

      return {
        baseSalary: base,
        allowances: allowance,
        bonuses: add,
        totalGross: gross,
        insurance: ins,
        tax: taxAmt,
        totalDeductions: deduction + ins + taxAmt,
        netSalary: net,
        workingDays: payroll.workingDays,
        leaveDays: payroll.leaveDays,
        salaryPerDay: payroll.salaryPerDay,
        isCalculated: true
      };
    }

    return {
      baseSalary: 0,
      allowances: 0,
      bonuses: 0,
      totalGross: 0,
      insurance: 0,
      tax: 0,
      totalDeductions: 0,
      netSalary: 0,
      workingDays: 0,
      leaveDays: 0,
      salaryPerDay: 0,
      isCalculated: false
    };
  }, [payroll]);

  const formatCurrency = (amount: number) => {
    if (amount === 0 || isNaN(amount)) return '---';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
        {isLoadingRole ? (
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
            Đang kiểm tra quyền...
          </div>
        ) : isAdmin ? (
          <Button type="button" variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        ) : null}
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
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết lương tháng {payroll?.month || selectedMonth}/{new Date().getFullYear()}
          </h3>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="text-sm text-gray-600 min-h-9 flex items-center italic">
              {isLoadingPayroll ? 'Đang tải dữ liệu lương...' : payroll ? `Dữ liệu tháng ${payroll.month}` : 'Chọn tháng để xem dữ liệu'}
            </div>
            
            <div className="flex flex-wrap items-end gap-3">
              {isAdmin && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Nhân viên</Label>
                  {isLoadingEmployees ? (
                    <div className="text-xs text-gray-500 h-9 flex items-center px-1">Đang tải...</div>
                  ) : (
                    <Popover
                      modal={false}
                      open={payrollEmployeeSelectOpen}
                      onOpenChange={setPayrollEmployeeSelectOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={payrollEmployeeSelectOpen}
                          className="h-9 w-[11.5rem] sm:w-64 justify-between font-normal text-sm px-2.5 bg-white border-slate-200 hover:border-indigo-500 transition-all rounded-lg"
                        >
                          <span className="truncate text-left font-medium text-slate-700">{payrollEmployeeSelectLabel}</span>
                          <ChevronDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput className="h-8 text-sm" placeholder="ID, tên, email…" />
                          <CommandList className="max-h-[min(240px,50vh)]">
                            <CommandEmpty>Không tìm thấy nhân viên.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                className="text-sm"
                                value="tai khoan cua toi me"
                                onSelect={() => {
                                  setSelectedEmployeeId('me');
                                  setPayrollEmployeeSelectOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-3.5 w-3.5 shrink-0',
                                    selectedEmployeeId === 'me' ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                Tài khoản của tôi
                              </CommandItem>
                              {employees.map((emp) => {
                                const label = getEmployeeDisplayLabel(emp);
                                const sub = getEmployeeSecondaryLine(emp);
                                return (
                                  <CommandItem
                                    key={emp.id}
                                    className="flex items-center gap-1 text-sm cursor-pointer"
                                    value={emp.id}
                                    keywords={[label, sub ?? '', emp.email ?? '', emp.phoneNumber ?? ''].filter(
                                      Boolean,
                                    )}
                                    onSelect={() => {
                                      setSelectedEmployeeId(emp.id);
                                      setPayrollEmployeeSelectOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-3.5 w-3.5 shrink-0',
                                        selectedEmployeeId === emp.id ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                      {label}
                                      {sub ? (
                                        <span className="text-muted-foreground font-normal italic"> · {sub}</span>
                                      ) : null}
                                    </span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tháng</Label>
                <div className="flex items-center gap-2">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9 w-24 text-sm bg-white border-slate-200 hover:border-indigo-500 rounded-lg">
                      <SelectValue placeholder="Tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = String(i + 1);
                        return (
                          <SelectItem key={m} value={m}>
                            Tháng {m}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {isAdmin && hasPermission('PAYROLL_GENERATE') && (
                    <Button 
                      onClick={handleCalculatePayroll} 
                      disabled={isCalculating}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 text-xs font-bold gap-2 rounded-lg shadow-sm"
                    >
                      {isCalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                      Tính lương tháng {selectedMonth}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && isPayrollDataMissing && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Chưa có dữ liệu lương chi tiết</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Hệ thống ghi nhận một số nhân viên chưa được tính lương trong tháng {selectedMonth}. 
                  Vui lòng bấm <strong>"Tính lương tháng {selectedMonth}"</strong> để bắt đầu quá trình tính toán tự động dựa trên ngày công và nghỉ phép.
                </p>
              </div>
            </div>
          )}

          {/* Admin: Bảng tổng hợp lương tháng */}
          {isAdmin && monthRows.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Bảng tổng hợp lương tháng {selectedMonth}
                </h4>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                  {monthRows.length} bản ghi
                </span>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50/80 backdrop-blur-sm">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ngày công</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Lương cơ bản</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thực nhận</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthRows.map((row: any) => (
                      <tr 
                        key={row.payrollId || row.user.id} 
                        className={`hover:bg-slate-50 transition-colors ${selectedEmployeeId === row.user.id ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{row.user.name}</span>
                            <span className="text-[11px] text-slate-500">{row.user.department || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${row.workingDays === null ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                            {row.workingDays ?? 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-medium ${row.baseSalary === null ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                            {formatCurrency(Number(row.baseSalary))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatCurrency(Number(row.finalSalary))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setSelectedEmployeeId(row.user.id)}
                            className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                              selectedEmployeeId === row.user.id 
                                ? 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100' 
                                : 'bg-white text-indigo-600 border-slate-200 hover:border-indigo-600'
                            }`}
                          >
                            {selectedEmployeeId === row.user.id ? 'Đang xem' : 'Chi tiết'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isAdmin && selectedEmployeeId !== 'me' && selectedEmployee && (
            <div className="flex items-center justify-between mb-4 animate-in slide-in-from-left duration-300">
              <div className="text-sm text-slate-600">
                Đang xem chi tiết lương của: <span className="font-bold text-slate-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">{selectedEmployee.fullName || selectedEmployee.email}</span>
              </div>
              <button 
                onClick={() => setSelectedEmployeeId('me')}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
              >
                Hủy xem chi tiết
              </button>
            </div>
          )}

          {payroll && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Ngày công</div>
                <div className="text-lg font-semibold text-gray-900">{payroll.workingDays}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Ngày nghỉ</div>
                <div className="text-lg font-semibold text-gray-900">{payroll.leaveDays}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Lương/ngày</div>
                <div className="text-lg font-semibold text-gray-900">{formatCurrency(payroll.salaryPerDay)}</div>
              </div>
            </div>
          )}

          {payroll && payroll.leaves && payroll.leaves.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/80">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Chi tiết nghỉ phép trong tháng</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {payroll.leaves.map((lv) => (
                  <li
                    key={lv.id || `${lv.startDate}-${lv.endDate}-${lv.type}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span>
                      {lv.startDate} → {lv.endDate}
                    </span>
                    <span className="text-gray-600">
                      {lv.type}
                      {lv.status ? ` · ${lv.status}` : ''}
                      {lv.reason ? ` — ${lv.reason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
        <div className="space-y-8">

          {/* ===== Màn 1: Phiếu lương của tôi ===== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Phiếu lương của tôi</h3>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
              {/* Month selector */}
              <div className="flex flex-wrap items-end gap-3 mb-5">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tháng</Label>
                  <Select value={payslipMonth} onValueChange={setPayslipMonth}>
                    <SelectTrigger className="h-9 w-28 text-sm bg-white border-slate-200 hover:border-indigo-500 rounded-lg">
                      <SelectValue placeholder="Tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = String(i + 1);
                        return <SelectItem key={m} value={m}>Tháng {m}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Card info */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Phiếu lương tháng {payslipMonth}/{new Date().getFullYear()}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">{(user as any).name || user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleViewPayslipPdf}
                  disabled={isPdfLoading !== null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                >
                  {isPdfLoading === 'view' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Xem phiếu lương
                </button>
                <button
                  onClick={handleDownloadPayslipPdf}
                  disabled={isPdfLoading !== null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                >
                  {isPdfLoading === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Tải xuống PDF
                </button>
              </div>
            </div>
          </div>

          {/* ===== Màn 2: Xuất lương nhân viên (admin only) ===== */}
          {isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Xuất phiếu lương nhân viên</h3>
                </div>

                {/* Month selector for export */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tháng</Label>
                  <Select value={exportMonth} onValueChange={setExportMonth}>
                    <SelectTrigger className="h-9 w-28 text-sm bg-white border-slate-200 hover:border-indigo-500 rounded-lg">
                      <SelectValue placeholder="Tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const m = String(i + 1);
                        return <SelectItem key={m} value={m}>Tháng {m}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách nhân viên...
                  </div>
                ) : employees.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Không có nhân viên nào.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Phiếu lương tháng {exportMonth}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employees.map((emp) => {
                          const rowLoading = rowPdfLoading[emp.id] ?? null;
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-slate-900">{emp.fullName || '—'}</span>
                                  <span className="text-[11px] text-slate-500">{emp.email}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-sm text-slate-600">{(typeof emp.department === 'object' && emp.department !== null ? (emp.department as any).name : emp.department) || '—'}</span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleRowViewPdf(emp)}
                                    disabled={rowLoading !== null}
                                    title="Xem phiếu lương"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                                  >
                                    {rowLoading === 'view' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                    Xem
                                  </button>
                                  <button
                                    onClick={() => handleRowDownloadPdf(emp)}
                                    disabled={rowLoading !== null}
                                    title="Tải xuống PDF"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-semibold shadow-sm"
                                  >
                                    {rowLoading === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    Tải PDF
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

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
