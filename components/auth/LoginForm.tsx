"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
// import { departmentService, Department } from '@/services/department.service';

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
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

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
  // const [departments, setDepartments] = useState<Department[]>([]);
  // const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  // const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // // Fetch departments from API on mount
  // useEffect(() => {
  //   const fetchDepartments = async () => {
  //     try {
  //       const data = await departmentService.getDepartments();
  //       setDepartments(data);
  //     } catch {
  //       setDepartments([]);
  //     } finally {
  //       setDepartmentsLoading(false);
  //     }
  //   };
  //   fetchDepartments();
  // }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: email,
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Lưu email, password và department vào sessionStorage để dùng sau khi verify OTP
      sessionStorage.setItem('pendingLoginEmail', data.email);
      sessionStorage.setItem('pendingLoginPassword', data.password);
      // if (selectedDepartment) {
      //   sessionStorage.setItem('selectedDepartment', selectedDepartment.id);
      // }

      // Gọi API loginOtp để gửi OTP
      await authService.loginOtp(data.email, data.password);

      setIdentifier(data.email);

      // Luôn chuyển sang màn hình MFA sau khi gửi OTP thành công
      toast.success("Mã OTP đã được gửi đến email của bạn");
      onSuccess(); // Chuyển sang form MFA

    } catch (error: unknown) {
      // Xóa pending credentials nếu lỗi
      sessionStorage.removeItem('pendingLoginEmail');
      sessionStorage.removeItem('pendingLoginPassword');
      sessionStorage.removeItem('selectedDepartment');

      const errMsg = error instanceof Error ? error.message : "Kiểm tra lại email hoặc mật khẩu";
      toast.error("Đăng nhập thất bại", { description: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    await handleLogin(data);
  };

  const handleQuickDemoLogin = async () => {
    const demoCredentials = {
      email: 'admin@hr.com.vn',
      password: 'Admin@123',
    };

    form.setValue('email', demoCredentials.email);
    form.setValue('password', demoCredentials.password);
    form.clearErrors();

    await handleLogin(demoCredentials);
  };

  void handleQuickDemoLogin; // unused but kept for future use

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access the workspace.</p>
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
    </div>
  );
}