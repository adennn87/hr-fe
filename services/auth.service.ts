import { fetchClient } from '@/lib/api';
import { RegisterFormValues } from '@/components/auth/RegisterForm';
import { UserProfile } from '@/types/types';
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

export const authService = {
  /**
   * Đăng nhập
   * @param email 
   * @param password 
   */
  async login(email: string, password: string) {
    return fetchClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Đăng ký tài khoản mới
   * @param data Dữ liệu từ form đăng ký
   */
  async register(data: RegisterFormValues) {
    // Nếu backend cần format lại dateOfBirth hoặc gender, xử lý ở đây trước khi gửi
    // Ví dụ: const payload = { ...data, gender: data.gender === 'male' ? 1 : 0 };
    return fetchClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
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