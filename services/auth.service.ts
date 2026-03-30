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
  taxCode?: string; // Add optional taxCode field
  salaryPerDay?: number;
  adjustments?: AdjustmentPayload[];
}

// Define return type for Login API
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

// Define payload type for Reset Password
export interface ResetPasswordPayload {
  email: string;
  otp: string;        // OTP code
  newPassword: string;
}

export const authService = {
  /**
   * Login
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

    // Map API response to UserProfile format, map full_name -> fullName if backend returns snake_case
    const userProfile: UserProfile = {
      id: response.user.id,
      fullName: response.user.fullName || response.user.full_name || response.user.name || '', // Prioritize fullName from DB
      email: response.user.email,
      role: response.user.role || response.user.roleId, // Prioritize role object
      department: '', // API does not return, leave empty or get from profile later
      location: '', // API does not return, leave empty or get from profile later
      avatar: '', // API does not return, leave empty or get from profile later
      mfaEnabled: false, // Default false, might need to check from API or profile
      permissions: response.user.permissions || [],
    };

    return {
      accessToken: response.accessToken,
      user: userProfile,
    };
  },

  /**
   * Register new account
   * @param data Data from register form
   */
  async register(data: RegisterFormValues, recaptchaToken?: string | null) {
    // Format gender from 'male'/'female'/'other' to 'Male'/'Female'/'Other' to match API
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
      taxCode: data.taxCode || undefined, // Send taxCode if available
      roleId: (data as any).roleId || undefined,
      salaryPerDay: data.salaryPerDay,
      adjustments: data.adjustments?.map(a => ({
    typeId: a.typeId,
    amount: a.amount,
    note: a.note || "",
  })) || [], // send empty array if not available
    };

    const body: Record<string, unknown> = { ...payload };
    if (recaptchaToken) body.recaptchaToken = recaptchaToken;

    return fetchClient<{ message: string; success: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Request forgot password (Send OTP to email)
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
   * Reset password (For ResetPassword screen)
   * @param payload Includes email, OTP code and new password
   */
  async resetPassword(payload: ResetPasswordPayload) {
    return fetchClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Send OTP on login (first step of login flow)
   * @param email User email
   * @param password Password
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
   * 2-Step Verification (MFA) - Verify OTP and login
   * @param code OTP code from Authenticator app/Email
   * @param email User email
   * @param password Password (from sessionStorage)
   */
  async verifyMfa(code: string, email: string, password: string) {
    return fetchClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp: code })
    });
  },

  /**
   * Get detailed Profile of current user
   * API endpoint: GET /users/profile (without /api prefix)
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
   * Update Profile of current user
   * API endpoint: PATCH /users (without /api prefix)
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