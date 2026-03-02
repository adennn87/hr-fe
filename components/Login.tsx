"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, Shield, UserPlus } from "lucide-react";
import type { User } from "@/lib/auth-types";

type LoginStep = "credentials" | "register" | "mfa" | "forgot" | "reset";

interface LoginProps {
  onLogin?: (user: User) => void;
  initialStep?: LoginStep;
}

const DEFAULT_USER: User = {
  id: "u-001",
  name: "Nguyen Van A",
  email: "admin@hr.com.vn",
  role: "HR Manager",
  department: "Human Resources",
  location: "Ho Chi Minh City",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=HR",
  mfaEnabled: true,
};

export function Login({ onLogin, initialStep = "credentials" }: LoginProps) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>(initialStep);
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStep(initialStep);
    setMessage("");
  }, [initialStep]);

  const handleAuthSuccess = (user: User) => {
    if (onLogin) {
      onLogin(user);
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    document.cookie = "access_token=mock-token; path=/; max-age=86400";
    router.push("/dashboard");
  };

  const buildUser = (): User => ({
    ...DEFAULT_USER,
    name: fullName.trim() || DEFAULT_USER.name,
    email: identifier.trim() || DEFAULT_USER.email,
  });

  const handleCredentialsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!identifier.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    setStep("mfa");
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!fullName.trim() || !identifier.trim() || !password.trim()) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    handleAuthSuccess(buildUser());
  };

  const handleForgotSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!identifier.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    setMessage("Verification code sent. Use any 6 digits to continue.");
    setStep("reset");
  };

  const handleResetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!otp.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage("Please complete the reset form.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage("Password updated. Please sign in.");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setStep("credentials");
  };

  const handleMfaSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (otp.trim().length < 6) {
      setMessage("Enter a valid 6-digit verification code.");
      return;
    }

    handleAuthSuccess(buildUser());
  };

  const renderBackButton = (target: LoginStep) => (
    <button
      type="button"
      onClick={() => {
        setMessage("");
        setStep(target);
      }}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );

  const renderMessage = () =>
    message ? (
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        {message}
      </div>
    ) : null;

  return (
    <div className="min-h-screen w-full bg-slate-100 lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.35),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.92),_rgba(15,23,42,1))]" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative z-10 flex items-center gap-3 text-lg font-semibold tracking-tight">
          <div className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur">
            <Shield className="h-6 w-6" />
          </div>
          <span>HR System</span>
          <span className="text-slate-400">| Enterprise</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight">
            Secure access for
            <br />
            <span className="text-blue-400">modern HR operations.</span>
          </h1>
          <ul className="space-y-4 text-slate-300">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-400" />
              <span>Continuous verification for workforce data and admin actions.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-400" />
              <span>Multi-step sign-in flow for employees, HR managers, and admins.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-400" />
              <span>Designed for payroll, recruitment, attendance, and core HR modules.</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-sm text-slate-300">Demo account</p>
          <p className="mt-2 text-lg font-semibold">{DEFAULT_USER.email}</p>
          <p className="text-sm text-slate-400">Use any password and any 6-digit MFA code.</p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white lg:hidden">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">HR System</h2>
            <p className="mt-2 text-sm text-slate-500">
              {step === "credentials" && "Sign in to continue to your dashboard."}
              {step === "register" && "Create your enterprise account."}
              {step === "mfa" && "Complete multi-factor authentication."}
              {step === "forgot" && "Recover access to your account."}
              {step === "reset" && "Set a new password and verify your identity."}
            </p>
          </div>

          <div className="space-y-5">
            {renderMessage()}

            {step === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@hr.com.vn"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                  <Shield className="h-4 w-4" />
                  Continue
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep("forgot");
                    }}
                    className="font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("");
                      setStep("register");
                    }}
                    className="font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Create account
                  </button>
                </div>
              </form>
            )}

            {step === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {renderBackButton("credentials")}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyen Van A"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </button>
              </form>
            )}

            {step === "mfa" && (
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {renderBackButton("credentials")}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Verification code sent to <span className="font-semibold text-slate-900">{identifier || DEFAULT_USER.email}</span>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">MFA code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                  <KeyRound className="h-4 w-4" />
                  Verify and sign in
                </button>
              </form>
            )}

            {step === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {renderBackButton("credentials")}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Work email</label>
                  <input
                    type="email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@hr.com.vn"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                  <Mail className="h-4 w-4" />
                  Send reset code
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {renderBackButton("forgot")}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter a new password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat the new password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Update password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
