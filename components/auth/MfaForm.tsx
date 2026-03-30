"use client";

import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UserProfile } from '@/types/types';
import { authService } from '@/services/auth.service';

// Import awesome OTP component from Shadcn
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface MfaFormProps {
  email: string;
  onBack: () => void;
  onLogin: (user: UserProfile) => void;
}

export function MfaForm({ email, onBack, onLogin }: MfaFormProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      // Lấy email và password từ sessionStorage
      const pendingEmail = sessionStorage.getItem('pendingLoginEmail');
      const pendingPassword = sessionStorage.getItem('pendingLoginPassword');

      if (!pendingEmail || !pendingPassword) {
        toast.error("Login information not found. Please login again.");
        onBack();
        return;
      }

      // Gọi API verify MFA với OTP, email và password
      const response = await authService.verifyMfa(otp, pendingEmail, pendingPassword);

      if (response.accessToken) {
        // Map response từ API sang UserProfile format, map full_name -> fullName nếu backend trả về snake_case
        const userProfile: UserProfile = {
          id: response.user.id,
          fullName: response.user.fullName || response.user.full_name || (response.user as any).name || '',
          email: response.user.email,
          role: response.user.role || response.user.roleId,
          department: '',
          location: '',
          avatar: '',
          mfaEnabled: true,
          permissions: response.user.permissions || [],
        };

        // Lưu vào localStorage (persistent storage)
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(userProfile));
        
        // Lưu vào sessionStorage (session storage - sẽ mất khi đóng tab)
        sessionStorage.setItem('accessToken', response.accessToken);
        sessionStorage.setItem('user', JSON.stringify(userProfile));
        
        // Lưu vào cookie (để middleware có thể đọc được)
        document.cookie = `access_token=${response.accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

        // Xóa pending credentials sau khi login thành công
        sessionStorage.removeItem('pendingLoginEmail');
        sessionStorage.removeItem('pendingLoginPassword');

        toast.success("Verification successful!");
        onLogin(userProfile);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error("Invalid authentication code", {
        description: error.message || "Please try again"
      });
      setOtp(""); // Reset OTP to re-enter
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      // Lấy email và password từ sessionStorage
      const pendingEmail = sessionStorage.getItem('pendingLoginEmail');
      const pendingPassword = sessionStorage.getItem('pendingLoginPassword');

      if (!pendingEmail || !pendingPassword) {
        toast.error("Login information not found. Please login again.");
        onBack();
        return;
      }

      // Gửi lại OTP
      await authService.loginOtp(pendingEmail, pendingPassword);
      toast.success("New OTP code has been sent to your email");
      setOtp(""); // Reset OTP
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      toast.error("Cannot resend OTP", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="animate-in zoom-in-95 duration-300">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
        </button>
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Two-Factor Authentication</h2>
        <p className="text-slate-500 mt-2 text-sm">
          We sent a verification code to <span className="font-semibold text-slate-900">{email}</span>.
          Enter the code below to continue.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <InputOTP maxLength={6} value={otp} onChange={(value: string) => setOtp(value)}>
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={0} className="w-12 h-14 text-lg border-2 rounded-lg" />
            <InputOTPSlot index={1} className="w-12 h-14 text-lg border-2 rounded-lg" />
            <InputOTPSlot index={2} className="w-12 h-14 text-lg border-2 rounded-lg" />
            <InputOTPSlot index={3} className="w-12 h-14 text-lg border-2 rounded-lg" />
            <InputOTPSlot index={4} className="w-12 h-14 text-lg border-2 rounded-lg" />
            <InputOTPSlot index={5} className="w-12 h-14 text-lg border-2 rounded-lg" />
          </InputOTPGroup>
        </InputOTP>

        <Button
          onClick={handleVerify}
          disabled={otp.length < 6 || isLoading}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Verify Identity
        </Button>

        <p className="text-xs text-slate-400">
          Didn't receive code?{' '}
          <button
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-blue-600 hover:underline font-medium disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend'}
          </button>
        </p>
      </div>
    </div>
  );
}