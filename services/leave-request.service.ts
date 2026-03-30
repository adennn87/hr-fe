import { API_URL } from '@/lib/api';

export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';

export interface CreateLeaveRequestPayload {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: LeaveType;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  user: any;
  /** Sometimes API returns flat userId instead of user object */
  userId?: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
}

function unwrapLeaveList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const inner = o.data ?? o.items ?? o.results ?? o.leaveRequests ?? o.leaves;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function normalizeLeaveStatus(s: unknown): 'PENDING' | 'APPROVED' | 'REJECTED' {
  const u = String(s ?? '')
    .trim()
    .toUpperCase();
  if (u === 'APPROVED' || u === 'APPROVE') return 'APPROVED';
  if (u === 'REJECTED' || u === 'REJECT') return 'REJECTED';
  return 'PENDING';
}

function normalizeLeaveType(t: unknown): LeaveType {
  const u = String(t ?? '')
    .trim()
    .toUpperCase();
  if (u === 'ANNUAL' || u === 'ANNUAL_LEAVE') return 'ANNUAL';
  if (u === 'SICK' || u === 'SICK_LEAVE') return 'SICK';
  if (u === 'UNPAID') return 'UNPAID';
  return 'OTHER';
}

/** Normalize a single leave request record from multiple API formats. */
export function normalizeLeaveRequest(raw: unknown): LeaveRequest {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      user: {},
      startDate: '',
      endDate: '',
      type: 'OTHER',
      reason: '',
      status: 'PENDING',
      rejectReason: null,
      createdAt: '',
    };
  }
  const r = raw as Record<string, unknown>;
  let userObj = r.user ?? r.employee;
  const uidFlat = r.userId ?? r.user_id;
  if ((!userObj || typeof userObj !== 'object') && uidFlat) {
    userObj = {
      id: String(uidFlat),
      fullName: r.userName ?? r.user_name ?? r.fullName ?? r.full_name,
      email: r.email,
    };
  }
  const uidFromUser =
    userObj && typeof userObj === 'object' && userObj !== null && 'id' in userObj
      ? String((userObj as { id: unknown }).id)
      : undefined;
  const resolvedUserId = uidFlat != null ? String(uidFlat) : uidFromUser;

  return {
    id: String(r.id ?? ''),
    user: userObj && typeof userObj === 'object' ? userObj : {},
    userId: resolvedUserId,
    startDate: String(r.startDate ?? r.start_date ?? ''),
    endDate: String(r.endDate ?? r.end_date ?? ''),
    type: normalizeLeaveType(r.type),
    reason: String(r.reason ?? ''),
    status: normalizeLeaveStatus(r.status),
    rejectReason:
      r.rejectReason != null
        ? String(r.rejectReason)
        : r.reject_reason != null
          ? String(r.reject_reason)
          : null,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  };
}

export function mapLeaveRequestList(raw: unknown): LeaveRequest[] {
  return unwrapLeaveList(raw).map((item) => normalizeLeaveRequest(item));
}

/** Employee display name (admin). */
export function getLeaveRequestEmployeeLabel(req: LeaveRequest): string {
  const u = req.user;
  if (u && typeof u === 'object') {
    const o = u as Record<string, unknown>;
    const name = o.fullName ?? o.full_name ?? o.name;
    const email = o.email;
    if (typeof name === 'string' && name.trim()) return name.trim();
    if (typeof email === 'string' && email.trim()) return email.trim();
    if (o.id) return String(o.id);
  }
  if (req.userId) return req.userId;
  return 'Employee';
}

/** userId to filter requests (prioritize flat field, then nested user). */
export function getLeaveRequestUserId(req: LeaveRequest): string | undefined {
  if (req.userId) return req.userId;
  const u = req.user;
  if (u && typeof u === 'object' && u !== null && 'id' in u) {
    const id = (u as { id?: unknown }).id;
    if (id !== undefined && id !== null) return String(id);
  }
  return undefined;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

/** Read error message from JSON or text (NestJS/class-validator usually returns message[]). */
function parseHttpErrorBody(status: number, text: string): string {
  const fallback = `Error ${status}${text ? `: ${text.slice(0, 280)}` : ''}`;
  if (!text?.trim()) {
    return status === 500
      ? 'Server error (500). Check submitted data format or backend logs.'
      : fallback;
  }
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const msg = j.message;
    if (Array.isArray(msg)) return msg.map(String).join('; ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (typeof j.error === 'string' && j.error.trim()) return j.error;
    if (typeof j.statusMessage === 'string') return j.statusMessage;
  } catch {
    return text.length > 300 ? `${text.slice(0, 300)}…` : text;
  }
  return fallback;
}

/** POST body variants to be compatible with NestJS/DTO (camelCase vs snake_case, type field name). */
function buildCreateLeaveBodyVariants(payload: CreateLeaveRequestPayload): Record<string, unknown>[] {
  const { startDate, endDate, type, reason } = payload;

  const typeLower = String(type).toLowerCase();

  return [
    { startDate, endDate, type, reason },
    { start_date: startDate, end_date: endDate, type, reason },
    { start_date: startDate, end_date: endDate, leave_type: type, reason },
    { startDate, endDate, leaveType: type, reason },
    { start_date: startDate, end_date: endDate, leaveType: type, reason },
    { startDate, endDate, type: typeLower, reason },
    { start_date: startDate, end_date: endDate, leave_type: typeLower, reason },
  ];
}

export const leaveRequestService = {
  async createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const url = `${baseUrl}/leave-requests`;
    const bodies = buildCreateLeaveBodyVariants(payload);

    let lastMessage = 'Cannot create leave request';

    for (const body of bodies) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      if (response.ok) {
        if (!text?.trim()) {
          throw new Error('Server did not return content (empty 200)');
        }
        try {
          return normalizeLeaveRequest(JSON.parse(text));
        } catch {
          throw new Error('Server response is not valid JSON');
        }
      }

      lastMessage = parseHttpErrorBody(response.status, text);

      if (response.status === 401 || response.status === 403) {
        throw new Error(lastMessage);
      }
    }

    throw new Error(lastMessage);
  },

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests/me`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const raw = await response.json();
    return mapLeaveRequestList(raw);
  },

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const raw = await response.json();
    return mapLeaveRequestList(raw);
  },

  async updateLeaveStatus(
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectReason?: string | null
  ): Promise<LeaveRequest> {
    const baseUrl = API_URL.replace('/api', '');
    const token = getAuthToken();

    const response = await fetch(`${baseUrl}/leave-requests/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status, rejectReason: rejectReason ?? null }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const raw = await response.json();
    return normalizeLeaveRequest(raw);
  },
};

