"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service'; // IMPORT SERVICE

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  email: string;
  setIdentifier: (val: string) => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export function LoginForm({ email, setIdentifier, onSuccess, onForgotPassword, onRegister }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: email,
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // GỌI API LOGIN
      const response = await authService.login(data.email, data.password);
      
      // Lưu token (Nếu Backend trả về token ngay bước này)
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      setIdentifier(data.email);

      // Kiểm tra logic MFA: 
      // Nếu user bật MFA -> gọi onSuccess() để chuyển sang màn hình nhập OTP
      // Nếu không -> Redirect vào Dashboard luôn (tùy luồng của bạn)
      if (response.user.mfaEnabled) {
          toast.info("Yêu cầu xác thực 2 bước (2FA)");
          onSuccess(); // Chuyển sang form MFA
      } else {
          toast.success("Đăng nhập thành công!");
          // Reload hoặc redirect vào trang chính
          window.location.href = '/dashboard'; 
      }

    } catch (error: any) {
      toast.error("Đăng nhập thất bại", {
        description: error.message || "Kiểm tra lại email hoặc mật khẩu"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access the workspace.</p>
        {/* <p className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Demo admin: <strong>admin@hr.com.vn</strong> / <strong>Admin@123</strong>
        </p> */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="name@company.com" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      className="h-11 pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-semibold shadow-lg shadow-blue-100">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Sign in <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500">Don&apos;t have an account? </span>
        <button onClick={onRegister} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
          Create an account
        </button>
      </div>
    </div>
  );
}