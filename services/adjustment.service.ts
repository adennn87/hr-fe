import { API_URL } from '@/lib/api';

export interface AdjustmentType {
  id: string;
  name: string;
  type: 'ADD' | 'DEDUCT';
  description?: string | null;
}

export const adjustmentService = {
  /**
   * Lấy danh sách adjustment types
   * API: GET /payroll/ajusmentType
   */
  async getAdjustmentTypes(): Promise<AdjustmentType[]> {
    const baseUrl = API_URL.replace('/api', '');

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token =
        sessionStorage.getItem('accessToken') ||
        localStorage.getItem('accessToken');
    }

    const response = await fetch(`${baseUrl}/payroll/ajusmentType`, {
      method: 'GET',
      headers: {
        accept: '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Error ${response.status}`
      );
    }

    return response.json();
  },
};