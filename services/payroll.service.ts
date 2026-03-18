import { API_URL } from '@/lib/api';

export type PayrollAdjustmentCategory = 'ADD' | 'SUB';

export interface PayrollAdjustment {
  id: string;
  name: string;
  category: PayrollAdjustmentCategory;
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
   * Backend endpoint có thể khác nhau giữa môi trường, nên thử nhiều path phổ biến.
   */
  async getPayrollByUserId(userId: string, month: string | number): Promise<PayrollDetail> {
    const baseUrl = API_URL.replace('/api', '');
    const m = String(month);

    const candidates = [
      // Query style
      `${baseUrl}/payroll?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`,
      `${baseUrl}/salaries?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/user/${userId}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/user/${userId}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/salary/user/${userId}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/salaries/user/${userId}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/${userId}?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/${userId}?month=${encodeURIComponent(m)}`,
      // Path style month segment
      `${baseUrl}/payroll/user/${userId}/${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/user/${userId}/${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/${userId}/${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/${userId}/${encodeURIComponent(m)}`,
      `${baseUrl}/leave-requests`, // sentinel (will never be used if above works)
    ];

    let lastErr: any = null;

    for (const url of candidates.slice(0, candidates.length - 1)) {
      try {
        const result = await tryGet<PayrollDetail>(url);
        console.log('✅ Payroll API succeeded:', { url, userId, month: m });
        return result;
      } catch (e: any) {
        lastErr = e;
        const status = e?.status;
        console.warn('⚠️ Payroll API candidate failed:', {
          url,
          status,
          responseText: e?.responseText?.slice?.(0, 200),
        });
        // 404: thử endpoint khác; 500: thử endpoint khác (có thể endpoint sai)
        if (status === 404 || status === 500) continue;
        // Các lỗi khác (401/403/400...) ném ra luôn để UI hiển thị
        throw e;
      }
    }

    console.warn('Payroll API: no candidate endpoint succeeded', {
      userId,
      month: m,
      lastStatus: lastErr?.status,
      lastResponseText: (lastErr as any)?.responseText?.slice?.(0, 300),
    });

    // Fallback cuối: nếu backend chỉ có API "bảng lương theo tháng", thì lọc theo userId
    try {
      const rows = await this.getPayrollByMonth(m);
      const found = rows.find((r) => r.user?.id === userId);
      if (found) {
        return {
          month: String(found.month ?? m),
          user: found.user,
          workingDays: 0,
          leaveDays: 0,
          salaryPerDay: 0,
          baseSalary: 0,
          allowance: 0,
          deduction: 0,
          finalSalary: Number(found.finalSalary ?? 0),
          adjustments: [],
          leaves: [],
        };
      }
    } catch {
      // ignore
    }

    throw lastErr || new Error('Không tìm thấy API lương phù hợp');
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
      `${baseUrl}/payroll?month=${encodeURIComponent(m)}`,
      `${baseUrl}/salaries?month=${encodeURIComponent(m)}`,
      `${baseUrl}/payroll/month/${encodeURIComponent(m)}`,
      `${baseUrl}/payrolls/month/${encodeURIComponent(m)}`,
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

        return list.map((row: any) => ({
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

    throw lastErr || new Error('Không tìm thấy API bảng lương theo tháng');
  },
};

