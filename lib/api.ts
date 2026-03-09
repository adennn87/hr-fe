// lib/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function fetchClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  
  // Tự động lấy token từ localStorage (nếu có)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Ném lỗi để component bắt được (message từ Backend trả về)
    throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
  }

  return response.json();
}