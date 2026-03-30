"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Gender, Position } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/services/auth.service";
import { departmentService, Department as APIDepartment } from "@/services/department.service";
import { roleService, type RoleOption } from "@/services/role.service";
import { RecaptchaWidget, type RecaptchaHandle } from "@/components/auth/RecaptchaWidget";
import { requireRecaptchaToken } from "@/lib/recaptcha-config";
import AdjustmentSelector from "../ui/AdjustmentSelector";
import { adjustmentService } from "@/services/adjustment.service";

// --- 1. SCHEMA VALIDATION ---
const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is too short"),
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
    department: z.string().min(1, "Please select department"),
    position: z.enum([Position.CEO, Position.Manager, Position.Employee]),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, "Invalid phone number"),

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
        message: "Employee must be at least 18 years old",
      }
    ),

    citizen_Id: z
      .string()
      .length(12, "ID card must be 12 digits")
      .regex(/^\d+$/, "Numbers only"),
    address: z.string().min(5, "Address is too short"),
    taxCode: z.string().optional(),

    password: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Needs 1 uppercase letter")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Needs 1 special character"),

    confirmPassword: z.string(),
    roleId: z.string().min(1, "Please select a role"),
    salaryPerDay: z.number().min(0, "Invalid salary"),

    adjustments: z
  .array(
    z.object({
      typeId: z.string(),
      amount: z.number(),
      note: z.string().optional(),
    })
  )
  .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Export type for reuse elsewhere if needed
export type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onBack: () => void;
}

export function RegisterForm({ onBack }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const recaptchaRef = useRef<RecaptchaHandle>(null);
  const [departments, setDepartments] = useState<APIDepartment[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  type AdjustmentType = {
    id: string;
    name: string;
    type: "ADD" | "DEDUCT";
  };

  const [adjustmentTypes, setAdjustmentTypes] = useState<AdjustmentType[]>([]);

const {
  register,
  handleSubmit,
  setValue,
  watch,
  formState: { errors },
} = useForm<RegisterFormValues>({
  resolver: zodResolver(registerSchema) as any,
  defaultValues: {
    gender: Gender.MALE,
    department: "",
    position: Position.Employee,
    taxCode: "",
    roleId: "",
    salaryPerDay: 0,
    adjustments: [],
  },
});

// Lấy adjustments từ form
const adjustments = watch("adjustments") || [];

  // Fetch departments from API on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
        toast.error("Cannot load department list");
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch roles for dropdown (admin only flow)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await roleService.getRoleOptions();
        setRoles(data);
      } catch (error) {
        console.error("Failed to fetch roles", error);
        toast.error("Cannot load role list");
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchAdjustmentTypes = async () => {
      try {
        const data = await adjustmentService.getAdjustmentTypes();
        setAdjustmentTypes(data);
      } catch (err) {
        console.error("Failed to fetch adjustment types", err);
      }
    };

    fetchAdjustmentTypes();
  }, []);

  const passwordValue = watch("password", "");
  const selectedDepartmentId = watch("department");
  const selectedPosition = watch("position");

  // Since we are using dynamic IDs now, the previous position mapping by name might not work as before.
  // For now, let's allow all positions for any department since we don't have a reliable mapping for dynamic IDs.
  // Unless the user wants to keep a specific mapping for certain IDs.
  // Use the full enum for available positions
  const availablePositions = Object.values(Position);

  // Calculate max date for input (Today - 18 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const requirements = [
    { re: /.{8,}/, label: "8+ characters" },
    { re: /[A-Z]/, label: "Uppercase letter" },
    { re: /[!@#$%^&*(),.?":{}|<>]/, label: "Special character" },
  ];

  // --- SUBMIT HANDLER (MODIFIED TO CALL API) ---
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Call register service
      // Backend dùng khóa ngoại department => gửi thẳng departmentId
      const response = await authService.register(data as any);

      // Hiển thị message từ API response
      toast.success(response.message || "Account registration successful", {
        description: "Please login to continue.",
      });

      // Switch to login page after 1.5 seconds so user can read message
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: unknown) {
      recaptchaRef.current?.reset();
      console.error("Register error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Please check your information.";
      toast.error("Registration failed", {
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
                {...register("fullName")}
                placeholder="Nguyen Van A"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.fullName.message}
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
            Select a department first, then choose an appropriate position.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("roleId")}
                disabled={rolesLoading}
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 ${errors.roleId ? "border-red-500" : "border-slate-200"
                  }`}
              >
                <option value="">
                  {rolesLoading ? "Loading roles..." : "Select role"}
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="text-red-500 text-xs mt-1">{errors.roleId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <select
                {...register("department")}
                disabled={departmentsLoading}
                className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 ${errors.department ? "border-red-500" : "border-slate-200"
                  }`}
              >
                <option value="">
                  {departmentsLoading ? "Loading departments..." : "Select department"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
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
                  disabled={!selectedDepartmentId}
                  className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400 ${errors.position ? "border-red-500" : "border-slate-200"
                    }`}
                >
                  {!selectedDepartmentId ? (
                    <option value="">Select department first</option>
                  ) : (
                    <option value="">Select position...</option>
                  )}

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

            <div className="space-y-2">
              <Label>
                Salary Per Day (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  {...register("salaryPerDay", { valueAsNumber: true })}
                  type="number"
                  placeholder="500000"
                  className={`pl-10 ${errors.salaryPerDay ? "border-red-500" : ""}`}
                />
                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.salaryPerDay && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.salaryPerDay.message}
                </p>
              )}
            </div>
          </div>
        </div>


<AdjustmentSelector
  adjustmentTypes={adjustmentTypes}
  value={(watch("adjustments") || []).map(a => {
    const adjType = adjustmentTypes.find(t => t.id === a.typeId);
    return {
      ...a,
      name: adjType?.name || "",
      type: adjType?.type || "ADD",
    };
  })}
  onChange={(data) =>
    setValue(
      "adjustments",
      data.map(({ typeId, amount, note }) => ({ typeId, amount, note })),
      { shouldValidate: true, shouldDirty: true }
    )
  }
/>



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
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${isMet
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

        <RecaptchaWidget ref={recaptchaRef} className="pt-1" />

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