"use client";

import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { UserProfile, MOCK_USERS } from '@/styles/types';

// Import component OTP xịn xò từ Shadcn
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

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    // Giả lập verify
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Logic kiểm tra (đơn giản là đúng 6 số thì cho qua)
    if (otp === "123456" || otp.length === 6) { // Mock logic
      toast.success("Xác thực thành công!");
      onLogin(MOCK_USERS[email]);
    } else {
      setIsLoading(false);
      toast.error("Mã xác thực không đúng");
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
           Didn't receive code? <button className="text-blue-600 hover:underline font-medium">Resend</button>
        </p>
      </div>
    </div>
  );
}