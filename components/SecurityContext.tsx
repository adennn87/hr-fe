"use client";

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, MapPin, Monitor, Clock, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { User, SecurityContextData } from '@/lib/auth-types';
import { ProfileModal } from './ProfileModal';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface SecurityContextProps {
  context: SecurityContextData;
  user: User;
  onLogout: () => void;
}

export function SecurityContext({ context, user, onLogout }: SecurityContextProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const safeUserName = (user.fullName || (user as any).full_name || '').trim() || 'User';
  const hasAvatar = Boolean(user.avatar?.trim());
  const userInitial = safeUserName.charAt(0).toUpperCase();

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'Thấp', color: 'green' };
    if (score < 70) return { label: 'Trung bình', color: 'yellow' };
    return { label: 'Cao', color: 'red' };
  };

  const riskLevel = getRiskLevel(context.riskScore);

  const handleFetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await authService.getProfile();
      setFullProfile(data);
      setIsProfileOpen(true);
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      toast.error("Không thể tải thông tin hồ sơ", {
        description: error.message
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Security Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Zero Trust HR</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {/* Device Health */}
              <div className="flex items-center gap-1.5">
                {context.deviceHealth === 'healthy' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : context.deviceHealth === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-gray-700">Thiết bị</span>
              </div>

              {/* Risk Score */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-${riskLevel.color}-100`}>
                <div className={`w-2 h-2 rounded-full bg-${riskLevel.color}-600`} />
                <span className={`text-${riskLevel.color}-900 font-medium`}>
                  Rủi ro: {riskLevel.label} ({context.riskScore})
                </span>
              </div>

              {/* MFA Status */}
              {context.mfaStatus && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-900 text-xs font-medium">MFA</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowDetails(!showDetails)}
                onBlur={() => setTimeout(() => setShowDetails(false), 200)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
              >
                {hasAvatar ? (
                  <img
                    src={user.avatar}
                    alt={safeUserName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {userInitial}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{safeUserName}</div>
                  <div className="text-xs text-gray-500">
                    {typeof user.role === 'object' ? user.role.name : user.role}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showDetails && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50">
                  <button
                    onClick={handleFetchProfile}
                    disabled={loadingProfile}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <UserIcon className="w-4 h-4" />
                    {loadingProfile ? 'Đang tải...' : 'Xem hồ sơ'}
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            <ProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              profile={fullProfile}
              onUpdate={handleFetchProfile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
