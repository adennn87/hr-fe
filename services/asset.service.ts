import { API_URL } from '@/lib/api';

export interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  assetCode: string;
  brand: string;
  model: string;
  purchaseDate: string;
  purchasePrice: string;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AllocatedAsset {
  id: string;
  asset: Asset;
  allocatedDate: string;
  returnedDate?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export const assetService = {
  /**
   * Lấy danh sách tài sản được cấp phát cho một nhân viên
   * @param employeeId ID của employee
   * API endpoint: GET /allocated-assets/allocate/me/{employeeId}
   */
  async getAllocatedAssetsByEmployee(employeeId: string): Promise<AllocatedAsset[]> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    // Thử endpoint /allocated-assets/allocate/me/{employeeId} trước
    let response = await fetch(`${baseUrl}/allocated-assets/allocate/me/${employeeId}`, {
      method: 'GET',
      headers: {
        'accept': '/',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Nếu endpoint trên không tồn tại (404) hoặc không có quyền (403), thử các endpoint khác
    if (!response.ok && (response.status === 404 || response.status === 403)) {
      console.log(`Endpoint /allocated-assets/allocate/me/${employeeId} returned ${response.status}, trying alternative endpoints...`);
      
      // Thử /allocated-assets/{employeeId}
      response = await fetch(`${baseUrl}/allocated-assets/${employeeId}`, {
        method: 'GET',
        headers: {
          'accept': '/',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    // Nếu vẫn không được, thử /allocated-assets/allocate/{employeeId}
    if (!response.ok && (response.status === 404 || response.status === 403)) {
      console.log(`Endpoint /allocated-assets/${employeeId} returned ${response.status}, trying /allocated-assets/allocate/${employeeId}...`);
      
      response = await fetch(`${baseUrl}/allocated-assets/allocate/${employeeId}`, {
        method: 'GET',
        headers: {
          'accept': '/',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
      
      // Nếu là 404, trả về mảng rỗng (có thể employee chưa có assets)
      if (response.status === 404) {
        console.warn(`No allocated assets found for employee ${employeeId}`);
        return [];
      }
      
      // Nếu là 403 (không có quyền), trả về mảng rỗng thay vì throw error
      // Vì có thể user không có quyền xem assets nhưng không phải lỗi nghiêm trọng
      if (response.status === 403) {
        console.warn(`Permission denied for viewing assets of employee ${employeeId}. Returning empty array.`);
        console.warn('Error message:', errorMessage);
        return [];
      }
      
      // Các lỗi khác mới log error và throw
      console.error(`API Error [${response.status}]:`, errorMessage);
      console.error('Response URL:', `${baseUrl}/allocated-assets/allocate/me/${employeeId}`);
      console.error('Full error data:', errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Assets API response:', data);
    console.log('✅ Is array?', Array.isArray(data));
    console.log('✅ Data length:', Array.isArray(data) ? data.length : 'Not an array');
    
    // Đảm bảo trả về array
    const result = Array.isArray(data) ? data : [];
    console.log('✅ Returning assets:', result.length, 'items');
    return result;
  },

  /**
   * Lấy toàn bộ danh sách tài sản được cấp phát (dành cho Admin/Manager)
   * API endpoint: GET /allocated-assets/allocate/list?status=
   */
  async getAllocatedAssets(status: string = ''): Promise<any[]> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const response = await fetch(`${baseUrl}/allocated-assets/allocate/list?status=${status}`, {
      method: 'GET',
      headers: {
        'accept': '/',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Lấy toàn bộ danh sách tài sản trong kho
   * API endpoint: GET /allocated-assets/asscetAll
   */
  async getInventoryAssets(): Promise<Asset[]> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const response = await fetch(`${baseUrl}/allocated-assets/asscetAll`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return await response.json();
  },

  // Asset CRUD
  async createAsset(data: any): Promise<Asset> {
    const baseUrl = API_URL.replace('/api', '');
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')) : null;
    
    const response = await fetch(`${baseUrl}/allocated-assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create asset');
    }
    return await response.json();
  },

  async updateAsset(id: string, data: any): Promise<Asset> {
    const baseUrl = API_URL.replace('/api', '');
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')) : null;
    
    const response = await fetch(`${baseUrl}/allocated-assets/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update asset');
    }
    return await response.json();
  },

  async deleteAsset(id: string): Promise<void> {
    const baseUrl = API_URL.replace('/api', '');
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')) : null;
    
    const response = await fetch(`${baseUrl}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to delete asset');
  },

  // Allocation CRUD
  async allocateAsset(data: { userId: string, assetId: string, allocatedDate: string, note: string }): Promise<any> {
    const baseUrl = API_URL.replace('/api', '');
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')) : null;
    
    const response = await fetch(`${baseUrl}/allocated-assets/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to allocate asset');
    }
    return await response.json();
  },

  async returnAsset(allocationId: string): Promise<void> {
    const baseUrl = API_URL.replace('/api', '');
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')) : null;
    
    const response = await fetch(`${baseUrl}/allocated-assets/alicatedAsset?id=${allocationId}`, {
      method: 'DELETE',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to return asset');
    }
  },
};
