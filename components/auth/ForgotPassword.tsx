"use client";

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Import Auth Service
import { authService } from '@/services/auth.service';
import { RecaptchaWidget, type RecaptchaHandle } from '@/components/auth/RecaptchaWidget';
import { requireRecaptchaToken } from '@/lib/recaptcha-config';

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// 1. Schema Validation
const forgotSchema = z.object({
  email: z.string().email("Vui lòng nhập địa chỉ email hợp lệ"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

interface ForgotPasswordFormProps {
  email: string; // Giá trị mặc định (nếu có từ bước Login)
  setIdentifier: (val: string) => void;
  onBack: () => void;
  onSuccess: () => void;
}

export function ForgotPasswordForm({ email, setIdentifier, onBack, onSuccess }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaRef = useRef<RecaptchaHandle>(null);

  // 2. Setup Form
  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: email || '',
    },
  });

  // 3. Handle Submit (Đã tích hợp API)
  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    try {
      const rc = requireRecaptchaToken(() => recaptchaRef.current?.getToken() ?? null);
      if (rc === null) {
        setIsLoading(false);
        return;
      }

      // Gọi API Forgot Password từ Service
      await authService.forgotPassword(data.email, rc);

      // Cập nhật lại email cho component cha (để bước Reset Password dùng lại)
      setIdentifier(data.email);

      toast.success("Mã xác thực đã được gửi!", {
        description: "Vui lòng kiểm tra hộp thư đến của bạn."
      });
      
      // Chuyển sang trang nhập OTP (ResetPassword)
      onSuccess(); 
    } catch (error: any) {
      recaptchaRef.current?.reset();
      console.error("Forgot password error:", error);
      toast.error("Gửi yêu cầu thất bại", {
        description: error.message || "Email không tồn tại hoặc có lỗi xảy ra."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-left-8 duration-500">
      
      {/* Header & Back Button */}
      <div className="flex p-8 pb-0">
        <button 
          onClick={onBack} 
          type="button"
          disabled={isLoading}
          className="p-2.5 rounded-full hover:bg-slate-50 text-slate-400 border border-slate-100 bg-white shadow-sm transition-all hover:text-blue-600 disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8 pt-4 text-center">
        {/* Icon Visual */}
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-orange-50">
          <KeyRound className="w-8 h-8 text-orange-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
        <p className="text-slate-500 text-sm mb-8 px-4">
          Don't worry, it happens. Enter your email linked to your account.
        </p>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                      <Input 
                        placeholder="name@company.com" 
                        {...field} 
                        className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-base" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <RecaptchaWidget ref={recaptchaRef} className="pt-2" />

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base shadow-lg shadow-blue-100 rounded-xl"
            >
              {isLoading ? (
                <>Sending Code <Loader2 className="ml-2 w-4 h-4 animate-spin" /></>
              ) : (
                "Send Reset Code"
              )}
            </Button>

          </form>
        </Form>
      </div>
    </div>
  );
}