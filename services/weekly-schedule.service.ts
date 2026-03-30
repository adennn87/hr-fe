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

// Get token from storage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export const weeklyScheduleService = {
  /**
   * Create new weekly schedule
   * API endpoint: POST /weekly-schedules (without /api prefix)
   */
  async createWeeklySchedule(data: CreateWeeklyScheduleRequest): Promise<WeeklySchedule> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const token = getAuthToken();
      
      // Log request data for debugging
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
        // Handle 401/403 errors - expired or invalid token
        if (response.status === 401 || response.status === 403) {
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            document.cookie = 'access_token=; path=/; max-age=0';
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
        
        // Read response text first (might not be JSON or empty)
        const responseText = await response.text().catch(() => '');
        let errorMessage = `Error ${response.status}: ${response.statusText || 'Internal Server Error'}`;
        let errorData: any = {};
        
        // Try to parse JSON if available
        if (responseText && responseText.trim()) {
          try {
            errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
          } catch (e) {
            // If JSON cannot be parsed, use text as error message
            console.warn('Failed to parse error response as JSON:', e);
            errorMessage = responseText.trim() || errorMessage;
          }
        }
        
        // Log details for debugging - log each field separately for readability
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
        
        // If 500 error and no detailed error message, add suggestion
        if (response.status === 500) {
          if (!errorData.message && !errorData.error && !responseText?.trim()) {
            errorMessage = 'Server error. Please check the data and try again.';
          } else if (!errorData.message && !errorData.error && responseText?.trim()) {
            errorMessage = `Server error: ${responseText.trim()}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error creating weekly schedule:', error);
      // If it is already a token error, do not wrap it
      if (error.message && error.message.includes('Session expired')) {
        throw error;
      }
      throw new Error(error.message || 'Cannot create weekly schedule');
    }
  },

  /**
   * Get list of weekly schedules
   * API endpoint: GET /weekly-schedules (without /api prefix)
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
        // Handle 401/403 errors - expired or invalid token
        if (response.status === 401 || response.status === 403) {
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            document.cookie = 'access_token=; path=/; max-age=0';
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
        
        // Get error message from response
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
          
          // Log details for debugging
          console.error('API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            endpoint
          });
        } catch (e) {
          // If JSON cannot be parsed, get text
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
      // If it is already a token error, do not wrap it
      if (error.message && error.message.includes('Session expired')) {
        throw error;
      }
      throw new Error(error.message || 'Cannot load weekly schedules');
    }
  },

  /**
   * Get my weekly schedules
   * API endpoint: GET /weekly-schedules/me (without /api prefix)
   */
  async getMyWeeklySchedule(): Promise<WeeklySchedule[]> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const token = getAuthToken();
      
      const response = await fetch(`${baseUrl}/weekly-schedules/me`, {
        method: 'GET',
        headers: {
          'accept': '/',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            document.cookie = 'access_token=; path=/; max-age=0';
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
        
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
        } catch (e) {
          const text = await response.text().catch(() => '');
          errorMessage = text || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching my weekly schedule:', error);
      if (error.message && error.message.includes('Session expired')) {
        throw error;
      }
      throw new Error(error.message || 'Cannot load my weekly schedules');
    }
  },

  /**
   * Update days in weekly schedule
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
      throw new Error(error.message || 'Cannot update weekly schedule');
    }
  },
};
