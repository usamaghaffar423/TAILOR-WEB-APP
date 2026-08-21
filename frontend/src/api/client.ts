import { useAuthStore } from '@/store/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to JSON if not a FormData body
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — clear auth and redirect to login
  if (response.status === 401) {
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new ApiError('Unauthenticated.', 401);
  }

  // Parse body — always JSON for our API
  let body: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const err = body as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(
      err.message ?? 'An unexpected error occurred.',
      response.status,
      err.errors
    );
  }

  return body as T;
}
