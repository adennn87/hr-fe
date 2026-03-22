import { API_URL } from '@/lib/api';

export type PayrollAdjustmentCategory = 'ADD' | 'SUB';

export interface PayrollAdjustment {
  id?: string;
  name: string;
  // Backend có thể trả "type" thay vì "category"
  category?: PayrollAdjustmentCategory;
  type?: PayrollAdjustmentCategory;
  amount: string | number;
  note?: string | null;
}

export interface PayrollLeave {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  rejectReason: string | null;
  createdAt: string;
}

export interface PayrollUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

export interface PayrollDetail {
  month: string;
  user: PayrollUser;
  workingDays: number;
  leaveDays: number;
  salaryPerDay: number;
  baseSalary: number;
  allowance: number;
  deduction: number;
  finalSalary: number;
  adjustments: PayrollAdjustment[];
  leaves: PayrollLeave[];
  /** BHXH + BHYT + BHTN (nếu backend tách dòng) */
  insurance?: number;
  /** Thuế TNCN */
  tax?: number;
}

function num(...vals: unknown[]): number {
  for (const v of vals) {
    if (v === undefined || v === null || v === '') continue;
    const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function unwrapPayrollPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const inner =
    r.data ?? r.payroll ?? r.result ?? r.payload ?? r.record;
  if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
  return r;
}

function departmentToString(d: unknown): string | null {
  if (d === undefined || d === null) return null;
  if (typeof d === 'string') return d;
  if (typeof d === 'object' && d !== null && 'name' in d) {
    const n = (d as { name?: unknown }).name;
    return typeof n === 'string' ? n : null;
  }
  return null;
}

/** Chuẩn hóa user từ nhiều dạng API (camelCase / snake_case / nested department). */
export function normalizePayrollUser(raw: unknown): PayrollUser {
  if (!raw || typeof raw !== 'object') {
    return { id: '', name: '', email: '', department: null };
  }
  const u = raw as Record<string, unknown>;
  const dept = u.department ?? u.dept;
  return {
    id: String(u.id ?? u.userId ?? u.user_id ?? ''),
    name: String(u.name ?? u.fullName ?? u.full_name ?? ''),
    email: String(u.email ?? ''),
    department: departmentToString(dept),
  };
}

function normalizeAdjustments(raw: unknown): PayrollAdjustment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== 'object') {
      return { name: 'Điều chỉnh', amount: 0, category: 'ADD' };
    }
    const a = item as Record<string, unknown>;
    return {
      id: a.id !== undefined ? String(a.id) : undefined,
      name: String(a.name ?? a.title ?? 'Điều chỉnh'),
      category: (a.category ?? a.type) as PayrollAdjustmentCategory | undefined,
      type: (a.type ?? a.category) as PayrollAdjustmentCategory | undefined,
      amount: num(a.amount, a.value),
      note: a.note != null ? String(a.note) : null,
    };
  });
}

function normalizeLeaves(raw: unknown): PayrollLeave[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== 'object') {
      return {
        id: '',
        startDate: '',
        endDate: '',
        type: '',
        reason: '',
        status: '',
        rejectReason: null,
        createdAt: '',
      };
    }
    const l = item as Record<string, unknown>;
    return {
      id: String(l.id ?? ''),
      startDate: String(l.startDate ?? l.start_date ?? ''),
      endDate: String(l.endDate ?? l.end_date ?? ''),
      type: String(l.type ?? ''),
      reason: String(l.reason ?? ''),
      status: String(l.status ?? ''),
      rejectReason:
        l.rejectReason != null
          ? String(l.rejectReason)
          : l.reject_reason != null
            ? String(l.reject_reason)
            : null,
      createdAt: String(l.createdAt ?? l.created_at ?? ''),
    };
  });
}

/**
 * Gộp nhiều dạng field backend (camelCase, snake_case, tên khác) về PayrollDetail thống nhất.
 */
export function normalizePayrollDetail(raw: unknown): PayrollDetail {
  const p = unwrapPayrollPayload(raw);

  const userFromNested = p.user;
  const userFlat =
    userFromNested ||
    (p.userId != null || p.user_id != null
      ? {
          id: p.userId ?? p.user_id,
          name: p.userName ?? p.user_name ?? p.fullName ?? p.full_name,
          email: p.email,
          department: p.department,
        }
      : null);

  const user = normalizePayrollUser(userFlat ?? {});

  const workingDays = num(
    p.workingDays,
    p.working_days,
    p.actualWorkingDays,
    p.actual_working_days,
    p.workDays,
    p.work_days,
  );
  const leaveDays = num(p.leaveDays, p.leave_days, p.totalLeaveDays, p.total_leave_days);
  const salaryPerDay = num(
    p.salaryPerDay,
    p.salary_per_day,
    p.dailySalary,
    p.daily_salary,
    p.salary_day,
  );
  const baseSalary = num(
    p.baseSalary,
    p.base_salary,
    p.salaryBase,
    p.salary_base,
    p.basicSalary,
    p.basic_salary,
  );
  const allowance = num(
    p.allowance,
    p.allowances,
    p.totalAllowance,
    p.total_allowance,
    p.phuCap,
    p.phu_cap,
  );
  const deduction = num(
    p.deduction,
    p.deductions,
    p.totalDeduction,
    p.total_deduction,
    p.khauTru,
    p.khau_tru,
  );
  const insurance = num(
    p.insurance,
    p.insuranceAmount,
    p.insurance_amount,
    p.socialInsurance,
    p.social_insurance,
    p.bhxh,
    p.totalInsurance,
    p.total_insurance,
  );
  const tax = num(
    p.tax,
    p.taxAmount,
    p.tax_amount,
    p.personalIncomeTax,
    p.personal_income_tax,
    p.thueTncn,
    p.thue_tncn,
  );

  let finalSalary = num(
    p.finalSalary,
    p.final_salary,
    p.netSalary,
    p.net_salary,
    p.actualSalary,
    p.actual_salary,
    p.thucNhan,
    p.thuc_nhan,
    p.totalReceive,
    p.total_receive,
  );

  const adjustments = normalizeAdjustments(p.adjustments ?? p.adjustmentList ?? p.adjustment_list);
  const leaves = normalizeLeaves(p.leaves ?? p.leaveRequests ?? p.leave_requests);

  const addAdj = adjustments
    .filter((a) => (a.category || a.type) === 'ADD')
    .reduce((s, a) => s + num(a.amount), 0);
  const subAdj = adjustments
    .filter((a) => (a.category || a.type) === 'SUB')
    .reduce((s, a) => s + num(a.amount), 0);

  const gross = baseSalary + allowance + addAdj;
  const totalDeductions = deduction + subAdj + insurance + tax;

  if (finalSalary === 0 && (gross > 0 || baseSalary > 0)) {
    const computed = gross - totalDeductions;
    if (computed > 0) finalSalary = computed;
  }

  return {
    month: String(p.month ?? p.monthNumber ?? p.month_number ?? ''),
    user,
    workingDays,
    leaveDays,
    salaryPerDay,
    baseSalary,
    allowance,
    deduction,
    finalSalary,
    adjustments,
    leaves,
    insurance: insurance || undefined,
    tax: tax || undefined,
  };
}

export interface PayrollMonthRow {
  payrollId?: string;
  month: string;
  user: PayrollUser;
  finalSalary: number;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

async function tryGet<T>(url: string): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: '*/*',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const err = new Error(`Error ${response.status}`);
    (err as any).status = response.status;
    (err as any).responseText = text;
    throw err;
  }

  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

export const payrollService = {
  /**
   * Lấy lương theo userId và month.
   * Thử nhiều endpoint phổ biến; chuẩn hóa field (snake_case / camelCase / nested user).
   */
  async getPayrollByUserId(userId: string, month: string | number): Promise<PayrollDetail> {
    const baseUrl = API_URL.replace('/api', '');
    const m = String(month);

    const candidates = [
      `${baseUrl}/payroll/user?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/user?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/user/${encodeURIComponent(userId)}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/users/${encodeURIComponent(userId)}/payroll?month=${encodeURIComponent(m)}`,
    ];

    let lastErr: unknown = null;
    for (const url of candidates) {
      try {
        const raw = await tryGet<unknown>(url);
        console.log('✅ Payroll by user succeeded:', url);
        return normalizePayrollDetail(raw);
      } catch (e: unknown) {
        lastErr = e;
        const status = (e as { status?: number })?.status;
        if (status === 404 || status === 500) continue;
        throw e;
      }
    }

    console.warn('Payroll by user: all candidates failed', {
      userId,
      month: m,
      lastErr,
    });
    throw lastErr instanceof Error
      ? lastErr
      : new Error('Không thể tải lương theo nhân viên');
  },

  /**
   * Lấy bảng lương theo tháng (tất cả user) cho admin.
   */
  async getPayrollByMonth(month: string | number): Promise<PayrollMonthRow[]> {
    const baseUrl = API_URL.replace('/api', '');
    const m = String(month);

    const candidates = [
      `${baseUrl}/payroll/month?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll?month=${encodeURIComponent(m)}`,
    ];

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const result = await tryGet<any>(url);
        const list: any[] = Array.isArray(result) ? result : (result?.data || result?.items || []);

        return list.map((row: any) => {
          const detail = normalizePayrollDetail(row);
          return {
            payrollId: row.payrollId ?? row.id ?? row.payroll_id,
            month: String(row.month ?? m),
            user: detail.user,
            finalSalary: detail.finalSalary,
            // Thêm các field thô để UI check null
            workingDays: row.workingDays,
            baseSalary: row.baseSalary,
          } as any;
        });
      } catch (e: any) {
        lastErr = e;
        if (e?.status === 404) continue;
        throw e;
      }
    }
    return [];
  },

  /**
   * Tính lương cho tất cả nhân viên trong tháng.
   * Sử dụng endpoint mới: POST /payroll/generate
   */
  async calculatePayroll(month: string | number): Promise<void> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();
    
    // Thêm query month nếu backend cần, nhưng curl của user không có.
    // Thử gọi /payroll/generate trực tiếp.
    const response = await fetch(`${baseUrl}/payroll/generate`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Không thể tính lương');
    }
  },
};

