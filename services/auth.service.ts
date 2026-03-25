import { fetchClient, API_URL } from '@/lib/api';
import { RegisterFormValues } from '@/components/auth/RegisterForm';
import { UserProfile } from '@/types/types';

export interface AdjustmentPayload {
  typeId: string;
  amount: number;
  note?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  department?: string;
  position?: string;
  citizen_Id?: string;
  roleId?: string;
  mfaEnabled?: boolean;
  taxCode?: string; // Thêm trường taxCode tùy chọn
  salaryPerDay?: number;
  adjustments?: AdjustmentPayload[];
}

// Định nghĩa kiểu dữ liệu trả về từ API Login
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    full_name?: string;
    name?: string;
    roleId: string;
    role?: {
      id: string;
      name: string;
      description?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    permissions: string[];
  };
}

// Định nghĩa kiểu dữ liệu cho payload Reset Password
export interface ResetPasswordPayload {
  email: string;
  otp: string;        // Mã OTP
  newPassword: string;
}

export const authService = {
  /**
   * Đăng nhập
   * @param email 
   * @param password 
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();


    const response = await fetchClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
    });

    // Map response từ API sang UserProfile format, map full_name -> fullName nếu backend trả về snake_case
    const userProfile: UserProfile = {
      id: response.user.id,
      fullName: response.user.fullName || response.user.full_name || response.user.name || '', // Ưu tiên fullName từ DB
      email: response.user.email,
      role: response.user.role || response.user.roleId, // Ưu tiên role object
      department: '', // API không trả về, sẽ để trống hoặc lấy từ profile sau
      location: '', // API không trả về, sẽ để trống hoặc lấy từ profile sau
      avatar: '', // API không trả về, sẽ để trống hoặc lấy từ profile sau
      mfaEnabled: false, // Mặc định false, có thể cần check từ API hoặc profile
      permissions: response.user.permissions || [],
    };

    return {
      accessToken: response.accessToken,
      user: userProfile,
    };
  },

  /**
   * Đăng ký tài khoản mới
   * @param data Dữ liệu từ form đăng ký
   */
  async register(data: RegisterFormValues, recaptchaToken?: string | null) {
    // Format gender từ 'male'/'female'/'other' thành 'Male'/'Female'/'Other' để khớp với API
    const genderMap: Record<string, string> = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other'
    };

    const payload: RegisterPayload = {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      gender: genderMap[data.gender] || data.gender, // Format gender
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      department: data.department,
      position: data.position,
      citizen_Id: data.citizen_Id,
      taxCode: data.taxCode || undefined, // Gửi taxCode nếu có
      roleId: (data as any).roleId || undefined,
      salaryPerDay: data.salaryPerDay,
      adjustments: data.adjustments?.map(a => ({
    typeId: a.typeId,
    amount: a.amount,
    note: a.note || "",
  })) || [], // nếu chưa có thì gửi mảng rỗng
    };

    const body: Record<string, unknown> = { ...payload };
    if (recaptchaToken) body.recaptchaToken = recaptchaToken;

    return fetchClient<{ message: string; success: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Gửi yêu cầu quên mật khẩu (Gửi OTP về email)
   * @param email 
   */
  async forgotPassword(email: string, recaptchaToken?: string | null) {
    const body: Record<string, unknown> = { email };
    if (recaptchaToken) body.recaptchaToken = recaptchaToken;
    return fetchClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Đặt lại mật khẩu (Dùng cho màn hình ResetPassword)
   * @param payload Gồm email, mã OTP và mật khẩu mới
   */
  async resetPassword(payload: ResetPasswordPayload) {
    return fetchClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Gửi OTP khi login (bước đầu tiên của login flow)
   * @param email Email người dùng
   * @param password Mật khẩu
   */
  async loginOtp(email: string, password: string, recaptchaToken?: string | null) {
    const body: Record<string, unknown> = { email, password };
    if (recaptchaToken) body.recaptchaToken = recaptchaToken;
    return fetchClient<{ message: string; success: boolean }>('/auth/loginOtp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Xác thực 2 bước (MFA) - Verify OTP và login
   * @param code Mã OTP từ ứng dụng Authenticator/Email
   * @param email Email người dùng
   * @param password Mật khẩu (lấy từ sessionStorage)
   */
  async verifyMfa(code: string, email: string, password: string) {
    return fetchClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp: code })
    });
  },

  /**
   * Lấy thông tin Profile chi tiết của người dùng hiện tại
   * API endpoint: GET /users/profile (không có /api prefix)
   */
  async getProfile(): Promise<any> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const response = await fetch(`${baseUrl}/users/profile`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  },

  /**
   * Cập nhật thông tin Profile của người dùng hiện tại
   * API endpoint: PATCH /users (không có /api prefix)
   */
  async updateProfile(data: any): Promise<any> {
    const baseUrl = API_URL.replace('/api', '');
    
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    }

    if (!token) {
      throw new Error('Authorization token is required');
    }

    const response = await fetch(`${baseUrl}/users`, {
      method: 'PATCH',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    return response.json();
  }
};