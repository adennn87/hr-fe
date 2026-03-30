"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, KeyRound, Eye, EyeOff, Check, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

// --- 1. SCHEMA VALIDATION (Sync with Register) ---
const resetSchema = z.object({
  otp: z.string().length(6, "OTP code must have exactly 6 digits").regex(/^\d+$/, "OTP code must contain only numbers"),
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Needs at least 1 uppercase letter")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Needs at least 1 special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

interface ResetPasswordFormProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPasswordForm({ email, onBack, onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- 2. SETUP FORM ---
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  // Track value to show checklist
  const passwordValue = watch("password", "");

  const requirements = [
    { re: /.{8,}/, label: "8+ characters" },
    { re: /[A-Z]/, label: "Uppercase letter" },
    { re: /[!@#$%^&*(),.?":{}|<>]/, label: "Special character" },
  ];

  // --- 3. SUBMIT ---
  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true);
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        toast.error('Missing email to reset password', {
          description: 'Please go back to previous step and enter email.',
        });
        return;
      }

      await authService.resetPassword({
        email: normalizedEmail,
        otp: data.otp,
        newPassword: data.password,
      });

      toast.success("Password reset successful!", {
        description: "Please login with your new password."
      });
      onSuccess();
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Password reset failed', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-8 duration-500">
      
      {/* HEADER */}
      <div className="flex p-8 pb-0">
        <button 
          onClick={onBack} 
          type="button"
          disabled={isLoading}
          className="p-2.5 rounded-full hover:bg-slate-50 text-slate-400 border border-slate-100 bg-white shadow-sm flex-shrink-0 transition-all hover:text-blue-600 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center pr-10 pt-1">
          <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
        </div>
      </div>
      
      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-6 space-y-6">
        
        {/* OTP INPUT */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center block">
            Enter 6-Digit OTP
          </label>
          <input 
            {...register("otp")}
            maxLength={6} 
            className={`w-full px-4 py-4 bg-slate-50 border-2 rounded-xl text-center text-3xl font-mono tracking-[0.5em] outline-none focus:border-blue-500 transition-all ${errors.otp ? 'border-red-500 focus:border-red-500' : 'border-slate-100'}`} 
            placeholder="000000" 
          />
          {errors.otp && <p className="text-red-500 text-xs text-center font-semibold">{errors.otp.message}</p>}
        </div>
        
        {/* NEW PASSWORD */}
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.password ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="New Password" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* CHECKLIST VISUAL (Giống form Register) */}
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            {requirements.map((req, i) => {
              const isMet = req.re.test(passwordValue);
              return (
                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 ${isMet ? 'bg-emerald-100 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  {req.label} {isMet && <Check className="w-3 h-3" />}
                </span>
              )
            })}
          </div>
        </div>
        
        {/* CONFIRM PASSWORD */}
        <div className="space-y-1">
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              {...register("confirmPassword")}
              type="password"
              className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}`} 
              placeholder="Confirm Password" 
            />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs font-semibold ml-1">{errors.confirmPassword.message}</p>}
        </div>
        
        {/* BUTTON */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg mt-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>Updating... <Loader2 className="w-4 h-4 animate-spin" /></>
          ) : (
            <>Update Password <KeyRound className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}