import { API_URL } from '@/lib/api';

export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';

export interface CreateLeaveRequestPayload {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: LeaveType;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  user: any;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export const leaveRequestService = {
  async createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests/me`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  async updateLeaveStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectReason?: string | null
  ): Promise<LeaveRequest> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status, rejectReason: rejectReason ?? null }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },
};

