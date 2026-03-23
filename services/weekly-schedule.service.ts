import { API_URL } from '@/lib/api';

export interface WeeklyScheduleDay {
  id?: string;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  startTime?: string | null; // Format: "HH:mm"
  endTime?: string | null; // Format: "HH:mm"
  isWorking: boolean;
  date?: string;
  isLeave?: boolean;
  leaveType?: string | null;
  leaveReason?: string | null;
}

export interface CreateWeeklyScheduleRequest {
  userId: string;
  weekStartDate: string; // Format: "YYYY-MM-DD"
  weekEndDate: string; // Format: "YYYY-MM-DD"
  days: WeeklyScheduleDay[];
}

export interface WeeklySchedule {
  id: string;
  userId?: string;
  user?: any; // Full user object
  weekStartDate: string;
  weekEndDate: string;
  status?: string;
  days: WeeklyScheduleDay[];
  createdAt?: string;
  updatedAt?: string;
}

// Lấy token từ storage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export const weeklyScheduleService = {
  /**
   * Tạo lịch làm việc tuần mới
   * API endpoint: POST /weekly-schedules (không có /api prefix)
   */
  async createWeeklySchedule(data: CreateWeeklyScheduleRequest): Promise<WeeklySchedule> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const token = getAuthToken();
      
      // Log request data để debug
      console.log('Creating weekly schedule with data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(`${baseUrl}/weekly-schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '/',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Xử lý lỗi 401/403 - token hết hạn hoặc không hợp lệ
        if (response.status === 401 || response.status === 403) {
          // Xóa token và redirect về login
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            document.cookie = 'access_token=; path=/; max-age=0';
            window.location.href = '/login';
          }
          throw new Error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        }
        
        // Đọc response text trước (vì có thể không phải JSON hoặc empty)
        const responseText = await response.text().catch(() => '');
        let errorMessage = `Error ${response.status}: ${response.statusText || 'Internal Server Error'}`;
        let errorData: any = {};
        
        // Thử parse JSON nếu có
        if (responseText && responseText.trim()) {
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
          } catch (e) {
            // Nếu không parse được JSON, dùng text làm error message
            console.warn('Failed to parse error response as JSON:', e);
            errorMessage = responseText.trim() || errorMessage;
          }
        }
        
        // Log chi tiết để debug - log từng field riêng để dễ đọc
        console.error('=== API Error Details ===');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('URL:', `${baseUrl}/weekly-schedules`);
        console.error('Method: POST');
        console.error('Request Body:', JSON.stringify(data, null, 2));
        console.error('Response Text:', responseText || '(empty)');
        console.error('Response Text Length:', responseText?.length || 0);
        console.error('Error Data:', Object.keys(errorData).length > 0 ? errorData : '(empty or invalid JSON)');
        console.error('========================');
        
        // Nếu là lỗi 500 và không có error message chi tiết, thêm gợi ý
        if (response.status === 500) {
          if (!errorData.message && !errorData.error && !responseText?.trim()) {
            errorMessage = 'Lỗi server. Vui lòng kiểm tra lại dữ liệu và thử lại.';
          } else if (!errorData.message && !errorData.error && responseText?.trim()) {
            errorMessage = `Lỗi server: ${responseText.trim()}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error creating weekly schedule:', error);
      // Nếu đã là lỗi về token, không wrap lại
      if (error.message && error.message.includes('Phiên làm việc hết hạn')) {
        throw error;
      }
      throw new Error(error.message || 'Không thể tạo lịch làm việc');
    }
  },

  /**
   * Lấy danh sách lịch làm việc
   * API endpoint: GET /weekly-schedules (không có /api prefix)
   */
  async getWeeklySchedules(userId?: string): Promise<WeeklySchedule[]> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const token = getAuthToken();
      const endpoint = userId ? `/weekly-schedules?userId=${userId}` : '/weekly-schedules';
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'accept': '/',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        // Xử lý lỗi 401/403 - token hết hạn hoặc không hợp lệ
        if (response.status === 401 || response.status === 403) {
          // Xóa token và redirect về login
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            document.cookie = 'access_token=; path=/; max-age=0';
            window.location.href = '/login';
          }
          throw new Error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
        }
        
        // Lấy error message từ response
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
          
          // Log chi tiết để debug
          console.error('API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            endpoint
          });
        } catch (e) {
          // Nếu không parse được JSON, lấy text
          const text = await response.text().catch(() => '');
          errorMessage = text || errorMessage;
          console.error('API Error (non-JSON):', {
            status: response.status,
            statusText: response.statusText,
            text,
            endpoint
          });
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching weekly schedules:', error);
      // Nếu đã là lỗi về token, không wrap lại
      if (error.message && error.message.includes('Phiên làm việc hết hạn')) {
        throw error;
      }
      throw new Error(error.message || 'Không thể tải lịch làm việc');
    }
  },

  /**
   * Cập nhật các ngày trong lịch tuần
   * API endpoint: PATCH /weekly-schedules/:id
   */
  async updateWeeklyScheduleDays(id: string, days: Partial<WeeklyScheduleDay>[]): Promise<WeeklySchedule> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const token = getAuthToken();
      
      const response = await fetch(`${baseUrl}/weekly-schedules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'accept': '/',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const text = await response.text().catch(() => '');
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error updating weekly schedule days:', error);
      throw new Error(error.message || 'Không thể cập nhật lịch làm việc');
    }
  },
};
