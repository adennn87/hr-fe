export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  location: string;
  avatar: string;
  mfaEnabled: boolean;
  taxCode?: string; // Thêm trường taxCode tùy chọn
}

export interface SecurityContextData {
  deviceHealth: 'healthy' | 'warning' | 'compromised';
  ipAddress: string;
  location: string;
  lastAuth: string;
  riskScore: number;
  mfaStatus: boolean;
  deviceType: string;
}

export const DEFAULT_SECURITY_CONTEXT: SecurityContextData = {
  deviceHealth: 'healthy',
  ipAddress: '103.28.36.124',
  location: 'Hanoi, Vietnam',
  lastAuth: new Date().toISOString(),
  riskScore: 15,
  mfaStatus: true,
  deviceType: 'Trusted Device',
};