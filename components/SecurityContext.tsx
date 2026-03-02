"use client";

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, MapPin, Monitor, Clock, LogOut, ChevronDown } from 'lucide-react';
import { User, SecurityContextData } from '@/lib/auth-types';

interface SecurityContextProps {
  context: SecurityContextData;
  user: User;
  onLogout: () => void;
}

export function SecurityContext({ context, user, onLogout }: SecurityContextProps) {
  const [showDetails, setShowDetails] = useState(false);
  const safeUserName = user.name?.trim() || 'User';
  const hasAvatar = Boolean(user.avatar?.trim());
  const userInitial = safeUserName.charAt(0).toUpperCase();

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'Thấp', color: 'green' };
    if (score < 70) return { label: 'Trung bình', color: 'yellow' };
    return { label: 'Cao', color: 'red' };
  };

  const riskLevel = getRiskLevel(context.riskScore);

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
            <button
              onClick={() => setShowDetails(!showDetails)}
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
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Security Details Dropdown */}
        {showDetails && (
          <div className="border-t border-gray-200 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Vị trí</p>
                  <p className="text-sm font-medium text-gray-900">{context.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Thiết bị</p>
                  <p className="text-sm font-medium text-gray-900">{context.deviceType}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Xác thực lần cuối</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(context.lastAuth).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">IP Address</p>
                  <p className="text-sm font-medium text-gray-900">{context.ipAddress}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
