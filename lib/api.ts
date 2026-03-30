// lib/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function fetchClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { headers, ...rest } = options;
  
  // Automatically get token from sessionStorage (prioritized) or localStorage
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  }

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
    // Throw error to be caught by component (message returned from Backend)
    throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
  }

  return response.json();
}