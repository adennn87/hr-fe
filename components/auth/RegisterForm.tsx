"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Shield,
  Loader2,
  Check,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Briefcase,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Gender, Department, Position } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";

// --- 1. SCHEMA VALIDATION ---
const registerSchema = z
  .object({
    full_name: z.string().min(2, "Họ tên quá ngắn"),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    department: z.enum([
      Department.SelectDepartment,
      Department.CEO,
      Department.HR,
      Department.IT,
      Department.Finance,
      Department.Marketing,
      Department.Sales,
    ]),
    position: z.enum([Position.CEO, Position.Manager, Position.Employee]),
    email: z.string().email("Email không hợp lệ"),
    phoneNumber: z
      .string()
      .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, "SĐT không hợp lệ"),

    // Logic check đủ 18 tuổi
    dateOfBirth: z.string().refine(
      (dateString) => {
        const birthDate = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age >= 18;
      },
      {
        message: "Nhân viên phải đủ 18 tuổi",
      }
    ),

    citizen_Id: z
      .string()
      .length(12, "CCCD phải đúng 12 số")
      .regex(/^\d+$/, "Chỉ nhập số"),
    address: z.string().min(5, "Địa chỉ quá ngắn"),
    taxCode: z.string().optional(),

    password: z
      .string()
      .min(8, "Tối thiểu 8 ký tự")
      .regex(/[A-Z]/, "Cần 1 chữ in hoa")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Cần 1 ký tự đặc biệt"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

// Export type để có thể dùng lại ở nơi khác nếu cần
export type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onBack: () => void;
}

export function RegisterForm({ onBack }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: Gender.MALE,
      department: Department.SelectDepartment,
      position: Position.Employee, // ✅ FIX: luôn có giá trị enum hợp lệ
      taxCode: "",
    },
  });

  const passwordValue = watch("password", "");

  const selectedDepartment = watch("department");
  const selectedPosition = watch("position");

  const departmentPositionMap = useMemo(
    () => ({
      [Department.CEO]: [Position.CEO],
      [Department.HR]: [Position.Manager, Position.Employee],
      [Department.IT]: [Position.Manager, Position.Employee],
      [Department.Finance]: [Position.Manager, Position.Employee],
      [Department.Marketing]: [Position.Manager, Position.Employee],
      [Department.Sales]: [Position.Manager, Position.Employee],
      // SelectDepartment không map => sẽ rơi xuống default
    }),
    []
  );

  // ✅ FIX: Khi chưa chọn department hợp lệ -> positions rỗng (để disable đúng)
  const availablePositions = useMemo(() => {
    if (selectedDepartment === Department.SelectDepartment) return [];
    return departmentPositionMap[selectedDepartment] ?? [Position.Employee];
  }, [departmentPositionMap, selectedDepartment]);

  useEffect(() => {
    // Khi chưa chọn department thật: reset position về Employee (giữ enum hợp lệ)
    if (selectedDepartment === Department.SelectDepartment) {
      if (selectedPosition !== Position.Employee) {
        setValue("position", Position.Employee, { shouldValidate: true });
      }
      return;
    }

    // Khi đã chọn department: đảm bảo position nằm trong list hợp lệ
    if (availablePositions.length > 0 && !availablePositions.includes(selectedPosition)) {
      setValue("position", availablePositions[0], { shouldValidate: true });
    }
  }, [availablePositions, selectedDepartment, selectedPosition, setValue]);

  // Tính ngày max cho input date (Hôm nay - 18 năm)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const requirements = [
    { re: /.{8,}/, label: "8+ ký tự" },
    { re: /[A-Z]/, label: "Chữ hoa" },
    { re: /[!@#$%^&*(),.?":{}|<>]/, label: "Ký tự đặc biệt" },
  ];

  // --- XỬ LÝ SUBMIT (ĐÃ SỬA ĐỂ GỌI API) ---
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Gọi service đăng ký
      await authService.register(data);

      toast.success("Đăng ký thành công!", {
        description: "Tài khoản đã được tạo. Vui lòng đăng nhập.",
      });

      // Quay lại trang login sau khi thành công
      onBack();
    } catch (error: unknown) {
      console.error("Register error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Vui lòng kiểm tra lại thông tin.";
      toast.error("Đăng ký thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-8 duration-500 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Account
          </h2>
          <p className="text-slate-500 text-sm">Employee Registration Portal</p>
        </div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 hover:text-blue-600 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* SECTION 1: PERSONAL INFO */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <User className="w-4 h-4" /> Personal Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label>
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("full_name")}
                placeholder="Nguyen Van A"
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>
                Gender <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("gender")}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
                <option value={Gender.OTHER}>Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  {...register("dateOfBirth")}
                  type="date"
                  max={maxDateString}
                  className={`pl-10 ${errors.dateOfBirth ? "border-red-500" : ""}`}
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* CCCD */}
            <div className="space-y-2">
              <Label>
                ID Card (CCCD) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  {...register("citizen_Id")}
                  maxLength={12}
                  placeholder="001234567890"
                  className={`pl-10 ${errors.citizen_Id ? "border-red-500" : ""}`}
                />
                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.citizen_Id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.citizen_Id.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: WORK INFO */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Work Information
          </div>
          <p className="text-xs text-slate-500">
            Chọn phòng ban trước, sau đó chọn chức vụ phù hợp.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("department")}
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${
                  errors.department ? "border-red-500" : "border-slate-200"
                }`}
              >
                {/* ✅ FIX: không dùng value="" để khỏi fail z.enum */}
                <option value={Department.SelectDepartment}>Select department</option>

                {/* ✅ tránh render trùng SelectDepartment */}
                {Object.values(Department)
                  .filter((d) => d !== Department.SelectDepartment)
                  .map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
              </select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.department.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Position <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <select
                  {...register("position")}
                  disabled={selectedDepartment === Department.SelectDepartment}
                  className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 ${
                    errors.position ? "border-red-500" : "border-slate-200"
                  }`}
                >
                  {/* ✅ FIX: không dùng value="" */}
                  {selectedDepartment === Department.SelectDepartment ? (
                    <option value={Position.Employee}>Select position</option>
                  ) : null}

                  {availablePositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                <Briefcase className="absolute right-3 top-2.5 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              {errors.position && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.position.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT INFO */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> Contact Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  {...register("phoneNumber")}
                  placeholder="0912..."
                  className={`pl-10 ${errors.phoneNumber ? "border-red-500" : ""}`}
                />
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tax Code (Optional)</Label>
              <Input {...register("taxCode")} placeholder="Tax Code" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("address")}
              placeholder="123 Street, City..."
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 3: ACCOUNT & SECURITY */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Account Security
          </div>

          <div className="space-y-2">
            <Label>
              Email Work <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="name@company.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {requirements.map((req, i) => {
                  const isMet = req.re.test(passwordValue);
                  return (
                    <span
                      key={i}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                        isMet
                          ? "bg-emerald-100 border-emerald-200 text-emerald-700 font-bold"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {req.label} {isMet && "✓"}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("confirmPassword")}
                type="password"
                placeholder="••••••••"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-200/50 rounded-xl"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Check className="w-5 h-5 mr-2" />
          )}
          Finalize Registration
        </Button>
      </form>
    </div>
  );
}