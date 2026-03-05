import { fetchClient } from '@/lib/api';
import { RegisterFormValues } from '@/components/auth/RegisterForm';
import { UserProfile } from '@/types/types';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  department?: string;
  position?: string;
  citizen_Id?: string;
  mfaEnabled?: boolean;
}

// Định nghĩa kiểu dữ liệu trả về từ API Login
export interface LoginResponse {
  accessToken: string;
  user: UserProfile; // Tận dụng interface UserProfile đã có ở types.ts
}

// Định nghĩa kiểu dữ liệu cho payload Reset Password
export interface ResetPasswordPayload {
  email: string;
  code: string;       // Mã OTP
  newPassword: string;
}

const DEMO_ADMIN = {
  email: 'admin@hr.com.vn',
  password: 'Admin@123',
  user: {
    id: 'u-001',
    name: 'System Admin',
    email: 'admin@hr.com.vn',
    role: 'System Admin',
    department: 'IT Security',
    location: 'Hanoi',
    avatar: '',
    mfaEnabled: true,
  } as UserProfile,
};

export const authService = {
  /**
   * Đăng nhập
   * @param email 
   * @param password 
   */
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (DEMO_ADMIN.email === normalizedEmail && DEMO_ADMIN.password === normalizedPassword) {
      return {
        accessToken: 'demo-admin-token',
        user: DEMO_ADMIN.user,
      } satisfies LoginResponse;
    }
    const response = await fetchClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return {
      ...response,
      user: {
        ...response.user,
        // fallback để tài khoản mới (backend chưa trả mfaEnabled) vẫn vào luồng 2FA
        mfaEnabled: response.user.mfaEnabled ?? true,
      },
    };
  },

  /**
   * Đăng ký tài khoản mới
   * @param data Dữ liệu từ form đăng ký
   */
  async register(data: RegisterFormValues) {
    // Nếu backend cần format lại dateOfBirth hoặc gender, xử lý ở đây trước khi gửi

    const payload: RegisterPayload = {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phoneNumber: data.phoneNumber,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      department: data.department,
      position: data.position,
      citizen_Id: data.citizen_Id,
      mfaEnabled: false, // Mặc định tắt MFA khi đăng ký, user có thể bật sau trong profile
    };
    // Ví dụ: const payload = { ...data, gender: data.gender === 'male' ? 1 : 0 };
    return fetchClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Gửi yêu cầu quên mật khẩu (Gửi OTP về email)
   * @param email 
   */
  async forgotPassword(email: string) {
    return fetchClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
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
   * Xác thực 2 bước (MFA)
   * @param code Mã OTP từ ứng dụng Authenticator/Email
   * @param email Email người dùng
   */
  async verifyMfa(code: string, email: string) {
    return fetchClient<LoginResponse>('/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ code, email })
    });
  },

  /**
   * Lấy thông tin Profile hiện tại (thường dùng khi F5 trang để lấy lại user context)
   */
  async getProfile() {
    return fetchClient<UserProfile>('/auth/profile', {
      method: 'GET',
    });
  }
};