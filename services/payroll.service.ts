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
   * Endpoint chuẩn:
   * GET /payroll/user?userId={userId}&month={month}
   */
  async getPayrollByUserId(userId: string, month: string | number): Promise<PayrollDetail> {
    const baseUrl = API_URL.replace('/api', '');
    const m = String(month);

    const url = `${baseUrl}/payroll/user?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`;
    return await tryGet<PayrollDetail>(url);
  },

  /**
   * Lấy bảng lương theo tháng (tất cả user) cho admin.
   * Trả về list row có user + finalSalary để dùng cho dropdown search.
   */
  async getPayrollByMonth(month: string | number): Promise<PayrollMonthRow[]> {
    const baseUrl = API_URL.replace('/api', '');
    const m = String(month);

    const candidates = [
      // Most likely (based on provided response)
      `${baseUrl}/payrolls?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls`,
      `${baseUrl}/payroll?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll?month=${encodeURIComponent(m)}`,
      `${baseUrl}/salaries?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/month/${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/month/${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/month?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/list?month=${encodeURIComponent(m)}`,
      `${baseUrl}/salary/month/${encodeURIComponent(m)}`,
      `${baseUrl}/salaries/month/${encodeURIComponent(m)}`,
    ];

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const result = await tryGet<any>(url);
        console.log('✅ Payroll Month API succeeded:', { url, month: m });

        // Backend có thể trả về array PayrollDetail hoặc payload wrapper
        const list: any[] = Array.isArray(result) ? result : (result?.data || result?.items || []);

        // Nếu endpoint không hỗ trợ filter month và trả về list nhiều tháng, filter lại theo month request
        const filtered = list.filter((row: any) => String(row.month ?? '').includes(m));

        return (filtered.length > 0 ? filtered : list).map((row: any) => ({
          payrollId: row.payrollId || row.id,
          month: String(row.month ?? m),
          user: row.user,
          finalSalary: Number(row.finalSalary ?? 0),
        })) as PayrollMonthRow[];
      } catch (e: any) {
        lastErr = e;
        const status = e?.status;
        console.warn('⚠️ Payroll Month API candidate failed:', {
          url,
          status,
          responseText: e?.responseText?.slice?.(0, 200),
        });
        if (status === 404 || status === 500) continue;
        throw e;
      }
    }

    // Nếu tất cả candidates đều 404/500 => backend chưa expose list theo tháng.
    // Trả về [] để UI fallback sang dropdown nhân viên (và vẫn gọi chi tiết theo userId).
    console.warn('Payroll Month API: no candidate endpoint succeeded', {
      month: m,
      lastStatus: lastErr?.status,
      lastResponseText: lastErr?.responseText?.slice?.(0, 200),
    });
    return [];
  },
};

