"use client";

import React, { useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm'; // (Dùng file bạn đã update ở bước trước)
import { ForgotPasswordForm } from './auth/ForgotPassword'; // (File cũ hoặc update sau)
import { ResetPasswordForm } from './auth/ResetPassword';
import { MfaForm } from './auth/MfaForm';
import { UserProfile } from '@/types/types';
import { CheckCircle2, Shield } from 'lucide-react';

type AuthStep = 'credentials' | 'register' | 'mfa' | 'forgot' | 'reset';

type LoginProps = {
  initialStep?: AuthStep;
  onLogin?: (user: UserProfile) => void;
};

export function Login({ onLogin, initialStep = 'credentials' }: LoginProps) {
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [identifier, setIdentifier] = useState('');

  const handleLoginSuccess = (user: UserProfile) => {
    if (onLogin) {
      onLogin(user);
      return;
    }

    window.location.href = '/dashboard';
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">

      {/* --- CỘT TRÁI: BRANDING & VISUAL (Chỉ hiện trên Desktop) --- */}
      <div className="hidden bg-slate-900 lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 text-lg font-bold tracking-tight">
          <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/20">
            <Shield className="w-6 h-6" />
          </div>
          HR System <span className="text-slate-400 font-normal">| Enterprise</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight">
            Secure Access for <br />
            <span className="text-blue-400">Modern Enterprises.</span>
          </h1>
          <ul className="space-y-4 text-slate-300">
            {[
              "Zero Trust Architecture (NIST 800-207)",
              "Multi-Factor Authentication (MFA)",
              "Real-time Threat Detection"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © 2026 HR System. ISO 27001 Certified.
        </div>
      </div>

      {/* --- CỘT PHẢI: FORM CONTAINER --- */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto w-full max-w-md space-y-8">

          {/* Header Mobile (Chỉ hiện khi màn hình nhỏ) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">HR System</h2>
          </div>

          {/* DYNAMIC FORMS */}
          <div className="transition-all duration-300">
            {step === 'credentials' && (
              <LoginForm
                email={identifier}
                setIdentifier={setIdentifier}
                onSuccess={() => setStep('mfa')}
                onForgotPassword={() => setStep('forgot')}
                onRegister={() => setStep('register')}
              />
            )}

            {step === 'register' && (
              <RegisterForm onBack={() => setStep('credentials')} />
            )}

            {step === 'mfa' && (
              <MfaForm
                email={identifier}
                onBack={() => setStep('credentials')}
                onLogin={handleLoginSuccess}
              />
            )}

            {step === 'forgot' && (
              <ForgotPasswordForm
                email={identifier}
                setIdentifier={setIdentifier}
                onBack={() => setStep('credentials')}
                onSuccess={() => setStep('reset')}
              />
            )}

            {step === 'reset' && (
              <ResetPasswordForm
                email={identifier}
                onBack={() => setStep('forgot')}
                onSuccess={() => setStep('credentials')}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}