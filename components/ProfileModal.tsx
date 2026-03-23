"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  Building2,
  Briefcase,
  Shield,
  BadgeDollarSign,
  Activity,
  UserCheck,
  Hash,
  Edit3,
  Save,
  X,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { Gender } from '@/types/types';

const profileSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, "SĐT không hợp lệ").optional().or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  citizen_Id: z.string().length(12, "CCCD phải đúng 12 số").optional().or(z.literal("")),
  taxCode: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate?: () => void;
}

export function ProfileModal({ isOpen, onClose, profile, onUpdate }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      citizen_Id: "",
      taxCode: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || "",
        phoneNumber: profile.phoneNumber || "",
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth || "",
        address: profile.address || "",
        citizen_Id: profile.citizen_Id || "",
        taxCode: profile.taxCode || "",
      });
    }
  }, [profile, reset]);

  if (!profile) return null;

  const handleUpdate = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(data);
      
      // Update local storage user if name changed
      const storedUserRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        const newUser = { ...storedUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
        sessionStorage.setItem('user', JSON.stringify(newUser));
      }

      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error("Cập nhật thất bại", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value, className = "", editableField = "" }: any) => {
    const isFieldEditing = isEditing && editableField;

    return (
      <div className={`flex flex-col gap-1 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all duration-300 ${isFieldEditing ? 'ring-2 ring-blue-500 bg-white border-blue-200' : 'hover:bg-white hover:shadow-md hover:border-blue-100'} ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Icon className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">{label}</span>
        </div>
        
        {isFieldEditing ? (
          <div className="space-y-1">
            {editableField === 'gender' ? (
              <select 
                {...register("gender")}
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <input
                {...register(editableField as keyof ProfileFormValues)}
                type={editableField === 'dateOfBirth' ? 'date' : 'text'}
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                autoFocus={editableField === 'fullName'}
              />
            )}
            {errors[editableField as keyof ProfileFormValues] && (
              <p className="text-[10px] text-red-500 font-bold">
                {errors[editableField as keyof ProfileFormValues]?.message}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-slate-800 leading-tight truncate" title={value}>
            {value || "---"}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-3xl border-none shadow-[0_20px_50px_rgba(8,112,184,0.1)] gap-0">
        <form onSubmit={handleSubmit(handleUpdate)}>
          {/* Header Section */}
          <DialogHeader className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-10 text-white relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left sm:gap-10">
              <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/10 text-white relative group overflow-hidden">
                {profile.fullName?.charAt(0) || "U"}
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  {isEditing ? (
                    <div className="mb-2">
                       <input
                        {...register("fullName")}
                        className="text-3xl font-black tracking-tight bg-white/10 border-b border-white/30 outline-none w-full px-2 rounded"
                        placeholder="Họ và tên"
                      />
                      {errors.fullName && <p className="text-xs text-red-400 mt-1 font-bold">{errors.fullName.message}</p>}
                    </div>
                  ) : (
                    <DialogTitle className="text-3xl font-black tracking-tight mb-2 drop-shadow-md">
                      {profile.fullName}
                    </DialogTitle>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-black px-3.5 py-1 text-xs tracking-wide">
                      {profile.position}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="absolute top-0 right-0 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          </DialogHeader>

          {/* Content Section with Tabs */}
          <div className="bg-white">
            <Tabs defaultValue="personal" className="w-full">
              <div className="px-10 -translate-y-6">
                <TabsList className="grid w-full grid-cols-2 p-1.5 bg-white shadow-xl rounded-2xl border border-slate-100 h-14">
                  <TabsTrigger value="personal" className="rounded-xl flex items-center gap-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 font-black text-xs uppercase tracking-widest">
                    <User className="w-4 h-4" /> Cá nhân
                  </TabsTrigger>
                  <TabsTrigger value="work" className="rounded-xl flex items-center gap-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300 font-black text-xs uppercase tracking-widest">
                    <Building2 className="w-4 h-4" /> Công việc
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="max-h-[50vh] overflow-y-auto px-10 pb-10 scrollbar-hide">
                <TabsContent value="personal" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem icon={Mail} label="Email" value={profile.email} />
                    <InfoItem icon={Phone} label="Số điện thoại" value={profile.phoneNumber} editableField="phoneNumber" />
                    <InfoItem icon={Calendar} label="Ngày sinh" value={profile.dateOfBirth} editableField="dateOfBirth" />
                    <InfoItem icon={UserCheck} label="Giới tính" value={profile.gender} editableField="gender" />
                    <InfoItem icon={Hash} label="Số CCCD" value={profile.citizen_Id} editableField="citizen_Id" />
                    <InfoItem icon={MapPin} label="Địa chỉ" value={profile.address} editableField="address" className="sm:col-span-2" />
                  </div>
                </TabsContent>

                <TabsContent value="work" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem icon={Building2} label="Phòng ban" value={profile.department?.name || profile.department} />
                    <InfoItem icon={Briefcase} label="Chức vụ" value={profile.position} />
                    <InfoItem icon={BadgeDollarSign} label="Lương / Ngày" value={profile.salaryPerDay ? `${Number(profile.salaryPerDay).toLocaleString()} VNĐ` : "---"} />
                    <InfoItem icon={Shield} label="Quyền hạn" value={profile.role?.name || profile.role} />
                    <InfoItem icon={Activity} label="Trạng thái" value={profile.status || (profile.isActive ? "Working" : "Resigned")} />
                    <InfoItem icon={CreditCard} label="Mã số thuế" value={profile.taxCode} editableField="taxCode" />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50/80 p-6 px-10 border-t border-slate-100 flex justify-between items-center backdrop-blur-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Lần cuối cập nhật: {new Date().toLocaleDateString('vi-VN')}
            </p>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); reset(); }}
                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                  >
                    HỦY
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 rounded-xl text-xs font-black text-white hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    LƯU THAY ĐỔI
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={onClose}
                  className="group relative px-8 py-2.5 bg-slate-900 overflow-hidden rounded-xl text-xs font-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  <span className="relative z-10">ĐÓNG</span>
                  <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
